import Field from './field.js';
import calculateScore from './score.js';
import * as textUtils from './textUtils.js';

const BATCH_SIZE = 100;
const LEVENSHTEIN_DISTANCE = 3;

export default class Vultos {
    constructor(config) {
        const configKeys = Object.keys(config);
        if (configKeys.length !== 1 || !config.hasOwnProperty('schema')) {
            throw new Error('Invalid configuration: Expected only a "schema" property.');
        }
        this.schema = config.schema;
        this.index = new Map();
        this.cache = new Map();
        this.levenshteinCache = new Map();
        this.docs = [];
        this.fields = [];

        for (const key in this.schema) {
            this.fields.push(new Field(key));
        }
    }

    addDoc(doc) {
        if (this.#validateDoc(doc)) {
            this.docs.push(doc);
            this.#addToIndex(doc);
        } else {
            throw new Error('Document does not match schema:', doc);
        }
    }

    addDocs(docsArray) {
        for (let i = 0; i < docsArray.length; i += BATCH_SIZE) {
            const batch = docsArray.slice(i, i + BATCH_SIZE);
            this.#processBatch(batch);
        }
    }

    removeDoc(docToRemove) {
        this.docs = this.docs.filter(doc => !this.#equals(doc, docToRemove));

        for (const [term, docsSet] of this.index) {
            for (const doc of Array.from(docsSet)) {
                if (this.#equals(doc, docToRemove)) {
                    docsSet.delete(doc);
                    if (docsSet.size === 0) {
                        this.index.delete(term);
                    }
                }
            }
        }
    }

    removeDocs(docsArray) {
        for (let i = 0; i < docsArray.length; i += BATCH_SIZE) {
            const batch = docsArray.slice(i, i + BATCH_SIZE);
            this.#processRemovalBatch(batch);
        }
    }

    search(query, parameters) {
        const startTime = performance.now();
        this.#handleParameters(parameters);

        try {
            const cacheKey = this.#createCacheKey(query, parameters);
            if (this.cache.has(cacheKey)) {
                const cachedResults = this.cache.get(cacheKey);
                return {
                    elapsed: performance.now() - startTime,
                    count: cachedResults.length,
                    hits: this.filterHitsByScore(cachedResults, parameters.score)
                };
            }

            const queryWords = query.toLowerCase().split(/\s+/).map(word => this.#stemmer(this.#sanitizeText(word)));
            let relevantDocs = new Set();

            queryWords.forEach(queryWord => {
                this.index.forEach((docsSet, indexedWord) => {
                    const distance = this.#levenshteinDistance(queryWord, indexedWord);
                    if (distance < LEVENSHTEIN_DISTANCE) {
                        docsSet.forEach(doc => relevantDocs.add(doc));
                    }
                });
            });

            let filteredDocs = Array.from(relevantDocs);

            if (parameters && parameters.where) {
                console.log("filteredDocs:", filteredDocs);
                filteredDocs = this.#applyWhereClause(filteredDocs, parameters.where);
            }

            let scoredDocs = filteredDocs.map(doc => {
                let score = this.#calculateScore(doc, queryWords);
                return { doc, score };
            });

            scoredDocs = scoredDocs.filter(item => item.score > 0)
                .sort((a, b) => b.score - a.score);

            let uniqueDocs = new Set();

            let hits = [];

            for (const item of scoredDocs) {
                const docStr = JSON.stringify(item.doc);
                if (!uniqueDocs.has(docStr)) {
                    uniqueDocs.add(docStr);
                    hits.push({ score: item.score, document: item.doc });
                }
            }

            this.cache.set(cacheKey, hits);

            hits = this.filterHitsByScore(hits, parameters.score);

            const endTime = performance.now();

            return {
                elapsed: endTime - startTime,
                count: hits.length,
                hits: hits,
                sortBy: (fieldName) => this.#sortByField(hits, fieldName)
            };
        } catch (error) {
            throw new Error(error.message);
        }
    }

    #sortByField(results, fieldName) {
        if (!this.schema.hasOwnProperty(fieldName) || this.schema[fieldName] !== 'string') {
            throw new Error(`Invalid field '${fieldName}'. Only string fields can be sorted.`);
        }

        return results.sort((a, b) => a.document[fieldName].localeCompare(b.document[fieldName]));
    }

    #equals(doc1, doc2) {
        const doc1Keys = Object.keys(doc1).sort();
        const doc2Keys = Object.keys(doc2).sort();
        if (JSON.stringify(doc1Keys) !== JSON.stringify(doc2Keys)) {
            return false;
        }

        for (const key of doc1Keys) {
            if (doc1[key] !== doc2[key]) {
                return false;
            }
        }

        return true;
    }

    #processBatch(batch) {
        for (const doc of batch) {
            if (this.#validateDoc(doc)) {
                this.docs.push(doc);
                this.#addToIndex(doc);
            } else {
                throw new Error('Document does not match schema:', doc);
            }
        }
    }

    #addToIndex(doc) {
        for (const field of this.fields) {
            if (doc[field.name] !== undefined && this.schema[field.name] === 'string') {
                const terms = this.#sanitizeText(doc[field.name]).split(/\s+/);
                terms.forEach(term => {
                    const stemmedTerm = this.#stemmer(term);
                    if (!this.index.has(stemmedTerm)) {
                        this.index.set(stemmedTerm, new Set());
                    }
                    this.index.get(stemmedTerm).add(doc);
                });
            }
        }
    }

    #validateDoc(doc) {
        for (const key in this.schema) {
            if (!doc.hasOwnProperty(key) || typeof doc[key] !== this.schema[key]) {
                return false;
            }
        }
        return true;
    }

    #processRemovalBatch(batch) {
        for (const docToRemove of batch) {
            this.#removeDocFromDocsArray(docToRemove);
            this.#removeDocFromIndex(docToRemove);
        }
    }

    #removeDocFromDocsArray(docToRemove) {
        this.docs = this.docs.filter(doc => !this.#equals(doc, docToRemove));
    }

    #removeDocFromIndex(docToRemove) {
        for (const [term, docsSet] of this.index) {
            for (const doc of Array.from(docsSet)) {
                if (this.#equals(doc, docToRemove)) {
                    docsSet.delete(doc);
                    if (docsSet.size === 0) {
                        this.index.delete(term);
                    }
                }
            }
        }
    }

    #handleParameters(parameters) {
        if (parameters) {
            const validKeys = ['fields', 'where', 'score'];
            for (const key in parameters) {
                if (!validKeys.includes(key)) {
                    throw new Error(`Unexpected parameter key '${key}'. Expected keys are 'fields', 'where', and 'score'`);
                }
            }

            if (parameters.fields) {
                for (const fieldName in parameters.fields) {
                    if (!this.schema.hasOwnProperty(fieldName)) {
                        throw new Error(`Field '${fieldName}' is not in the schema.`);
                    }
                }
            }

            this.#setParameters(parameters);
        }
    }

    #applyWhereClause(docs, whereClause) {
        for (const key in whereClause) {
            if (!this.schema.hasOwnProperty(key)) {
                throw new Error(`Field '${key}' does not exist in the schema`);
            }

            const condition = whereClause[key];
            const expectedType = this.schema[key];
            const validConditionKeys = ['lt', 'lte', 'gt', 'gte', 'bt', 'eq', 'inc'];

            if (typeof condition === 'object' && condition !== null) {
                for (const conditionKey in condition) {
                    if (!validConditionKeys.includes(conditionKey)) {
                        throw new Error(`Unrecognized condition '${conditionKey}' on field '${key}'`);
                    }
                }
            }

            if (expectedType === 'number') {
                if (condition.eq !== undefined && typeof condition.eq === 'number') {
                    docs = docs.filter(doc => doc[key] === condition.eq);
                }
            } else if (expectedType === 'string') {
                if (condition.eq !== undefined && typeof condition.eq === 'string') {
                    docs = docs.filter(doc => doc[key] === condition.eq);
                }
                if (condition.inc !== undefined && typeof condition.inc === 'string') {
                    docs = docs.filter(doc => doc[key].includes(condition.inc));
                }
            } else if (expectedType === 'boolean' && typeof condition !== 'boolean') {
                throw new Error(`Expected a boolean for condition on field '${key}', but got ${typeof condition}`);
            }
        }

        return docs.filter(doc => {
            for (const key in whereClause) {
                const condition = whereClause[key];
                const docValue = doc[key];

                if (typeof condition === 'object' && condition !== null) {
                    if (condition.bt && Array.isArray(condition.bt) && condition.bt.length === 2) {
                        const [min, max] = condition.bt;
                        if (docValue < min || docValue > max) {
                            return false;
                        }
                    } else if (condition.lt && docValue >= condition.lt) {
                        return false;
                    } else if (condition.lte && docValue > condition.lte) {
                        return false;
                    } else if (condition.gt && docValue <= condition.gt) {
                        return false;
                    } else if (condition.gte && docValue < condition.gte) {
                        return false;
                    }
                }
            }
            return true;
        });
    }

    filterHitsByScore(hits, scoreConditions) {
        if (!scoreConditions) return hits;

        const validScoreKeys = ['gt', 'lt', 'eq'];
        for (const key in scoreConditions) {
            if (!validScoreKeys.includes(key)) {
                throw new Error(`Invalid score condition '${key}'. Expected conditions are 'gt', 'lt', and 'eq'`);
            }

            const score = scoreConditions[key];
            if (score <= 0 || score >= 1) {
                throw new Error(`Invalid score value '${score}'. Score must be between 0 and 1.`);
            }
        }

        return hits.filter(hit => {
            if (scoreConditions.gt !== undefined && hit.score <= scoreConditions.gt) {
                return false;
            }
            if (scoreConditions.lt !== undefined && hit.score >= scoreConditions.lt) {
                return false;
            }
            if (scoreConditions.eq !== undefined && hit.score !== scoreConditions.eq) {
                return false;
            }
            return true;
        });
    }

    #createCacheKey(query, parameters) {
        return JSON.stringify({ query, parameters });
    }

    #setParameters(parameters) {
        if (parameters && parameters.fields) {
            for (const fieldName in parameters.fields) {
                if (!this.schema.hasOwnProperty(fieldName)) {
                    throw new Error(`Field '${fieldName}' is not in the schema.`);
                }

                const fieldParams = parameters.fields[fieldName];
                const field = this.fields.find(f => f.name === fieldName);
                if (field && fieldParams.weight !== undefined) {
                    if (fieldParams.weight > 5) {
                        console.warn(`Weight for field '${fieldName}' is too high, setting to 5`);
                        field.setWeight(5);
                    } else if (fieldParams.weight < 1) {
                        console.warn(`Weight for field '${fieldName}' is too low, setting to 1`);
                        field.setWeight(1);
                    } else {
                        field.setWeight(fieldParams.weight);
                    }
                }
            }
        }
    }

    #calculateScore(doc, queryWords) {
        return calculateScore(doc, queryWords, this.fields, this.schema, this.#levenshteinDistance.bind(this));
    }

    #sanitizeText(text) {
        return textUtils.sanitizeText(text);
    }

    #stemmer(word) {
        return textUtils.stemmer(word);
    }

    #levenshteinDistance(a, b) {
        const cacheKey = `${a}:${b}`;
        if (this.levenshteinCache.has(cacheKey)) {
            return this.levenshteinCache.get(cacheKey);
        }

        const distance = textUtils.levenshteinDistance(a, b);
        this.levenshteinCache.set(cacheKey, distance);
        return distance;
    }
}