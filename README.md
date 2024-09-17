Vultos offers a comprehensive solution for managing and searching documents within your project. Its key features include full-text search with customizable weighting, support for boolean and numeric range queries, and an extensible schema definition catering to various data types. Users can expect enhanced performance through optimized indexing, caching, and querying, backed by strict configuration validation aligned with the schema. Installation is straightforward, either via npm for Node.js projects or directly in the browser. Initialization involves defining a schema to categorize your data effectively, supporting data types like strings, numbers, and booleans. Adding and removing documents is simple and intuitive, requiring adherence to the defined schema. The search functionality is robust, offering detailed configuration options, including field weighting, condition-based queries, and result scoring. Search results are returned with comprehensive details, including relevance scores and document specifics, ensuring efficient data retrieval and management. Vultos is available under the MIT License, making it a versatile and accessible choice for developers.

# Highlighted features
 - Full-text search with customizable weighting and scoring.
 - Boolean and numeric range queries.
 - Extensible schema definition for varied data types.
 - Performance optimizations with indexing, caching and efficient querying.
 - Strict configuration validation to match with schema.

# Installation
There are two ways to install Vultos and start using it in your project:

1. Using `npm` (Node.js):
   - Open a terminal in your project directory.
   - Run the following command:

```sh
npm i vultos
```
2. Directly in a browser module (without Node.js):

```html
<script type="module" src="https://unpkg.com/vultos@latest/dist/vultos.js"></script>
```

# Initialization
### Defining Your Data Structure: Initialization with Schema
Vultos thrives on understanding your data, and that starts with the schema you define during initialization. The schema tells Vultos what kind of information to expect in your documents, allowing it to efficiently store, search, and retrieve relevant data for your needs.

### Supported Data Types:
Currently, Vultos supports three basic data types for your document fields:
 - String: Text information like titles, descriptions, or names.
 - Number: Numeric values like years, counts, or measurements.
 - Boolean: True or false values for binary states like availability or completion.

### Example Schema:

```js
const vultos = new Vultos({
    schema: {
        title: 'string',
        author: 'string',
        year: 'number',
        isAvailable: 'boolean'
        // other fields...
    }
});
```

### In this schema:
 - Each field name, like title or year, becomes a key in your documents.
 - The corresponding data type indicates what kind of value you expect for each field.
 - You can define as many fields as needed to accurately represent your data.

# Adding and removing documents
Once you have your schema defined, you can start adding documents to your Vultos instance. Remember, each document must adhere to the defined schema:

```js
vultos.addDoc({
    title: 'Example Title',
    author: 'Example Author',
    year: 2000,
    isAvailable: false
});
```
Important Note:

Adding fields to your documents that weren't defined in the schema will result in validation errors. Ensure your data structure and schema align for smooth operation.

### Adding multiple documents
Alternatively you can add multiple docs at the same time. Remember, each and every document added to your Vultos instance must adhere to the predefined schema.

```js
vultos.addDocs([{
        "title": "Title One",
        "author": "Author One",
        "year": 1800,
        "isAvailable": false,
    },
    {
        "title": "Title Two",
        "author": "Author Two",
        "year": 2010,
        "isAvailable": true,
}]);
```

# Removing documents
Just like organizing your bookshelf, managing your data sometimes requires removing documents that are no longer needed or relevant. Vultos offers two handy methods for this task:
 - `removeDoc(document)`: Removes a single document from your Vultos instance.
 - `removeDocs(documentArray)`: Removes multiple documents from your Vultos instance in one go.

 Important Note: Both methods require an exact match with the document you want to remove. This means the complete content and structure of the document you provide must be identical to the existing one in your Vultos instance for the removal to be successful.

Remember:
 - Removing a document is permanent and cannot be undone.
 - Make sure you're confident about removing the desired documents before proceeding.

 ```js
vultos.removeDoc({
    title: 'Example Title',
    author: 'Example Author',
    year: 2000,
    isAvailable: false
});
```

```js
vultos.removeDocs([{
        "title": "Title One",
        "author": "Author One",
        "year": 1800,
        "isAvailable": false,
    },
    {
        "title": "Title Two",
        "author": "Author Two",
        "year": 2010,
        "isAvailable": true,
}]);
```

### Removing documents conditionally
Sometimes you want to remove documents conditionally, based on a certain condition. For example, you might want to remove all books that are not available. This can be done by using the `where` clause in the `removeDocs` method. Currently, the `where` clause here only accepts one field at a time. 

```js
vultos.removeDocs({
    where: {
        keywords: { inc: "roman" }
    }
});
```
In this example, all documents that have the keyword "roman" in their keywords will be removed. As of the latest release, the `where` clause supports the following comparison operators: 
String:
 - `eq`: Matches documents where the field value is equal to the provided value.
 - `inc`: Matches documents where the field value contains the provided value.

Numbers:
 - `eq`: Matches documents where the field value is equal to the provided value.
 - `gt`: Matches documents where the field value is greater than the provided value.
 - `gte`: Matches documents where the field value is greater than or equal to the provided value.
 - `lt`: Matches documents where the field value is less than the provided value.
 - `lte`: Matches documents where the field value is less than or equal to the provided value.

# Searching
Searching is as simple calling the search method with a specified query.

```js
const results = vultos.search('search query');
```

# Search configuration
The configuration allows for more precise querying. Certain fields can be weighted differently from 1-5 with the default being 1 for each unspecified field. The higher the weight, the more "important" a field is considered in your search.

```js
const searchResults = vultos.search('search query', {
    fields: {
        title: { weight: 5 },
        author: { weight: 3 }
    }}
});
```

### Where clause
Need to narrow your search further? The `where` clause lets you define specific conditions for the data you're looking for. It supports various types of comparisons across numeric, boolean, and date fields.

Numeric Range Queries:
 - `bt`: This keyword is used to find documents where a numeric field falls within a specific range (inclusive).
    ```js
    const searchResults = vultos.search('historical fiction', {
      where: {
        year: { bt: [1700, 1900] },
      }
    });
    ```
 - `lt`: This keyword finds documents where a numeric field is less than a specific value.
    ```js
    const searchResults = vultos.search('old novels', {
      where: {
        year: { lt: 1960 },
      }
    });
    ```
 - `gt`: This keyword finds documents where a numeric field is greater than a specific value.
  
    ```js
    const searchResults = vultos.search('upcoming releases', {
      where: {
        publicationDate: { gt: 2023 },
      }
    });
    ```
 - `eq`: This keyword finds documents where a numeric field is equal to a specific value.
  
    ```js
    const searchResults = vultos.search('upcoming releases', {
      where: {
        publicationDate: { eq: 2020 },
      }
    });
    ```
Boolean Comparisons:
  - You can use simple true and false values to match or exclude documents based on boolean fields.
    ```js
    const searchResults = vultos.search('available books', {
      where: {
        isAvailable: true,
      }
    });
    ```
### Ignoring certain fields
Sometimes when searching, certain fields seem irrelevant to the search query. In such cases, you can ignore certain fields by specifying them in the `ignore` array. This does not remove the field from the documents or the schema but rather does not consider them when calculating the score for each document. 

```js
const searchResults = vultos.search(searchQuery, {
    fields: {
        title: { weight: 5 }
    },
    ignore: ["year", "keywords"]
});
```
Remember: the `ignore` keyword must contain an array with the fields you want to ignore.

### Filtering results by score
The capability to refine search results through scoring metrics is an integral feature of our system. Each document within the database is assigned a score, which can be utilized for filtering purposes. This scoring mechanism leverages the same set of keywords as those employed in the `where` clause. The `score` attribute is specifically designed to allow users to customize their search criteria according to their requirements.

The following example illustrates the implementation of this feature:

```js
const searchResults = vultos.search(searchQuery, {
    fields: {
        title: { weight: 1 },
        author: { weight: 1 }
    }, score: { gt: 0.1 }
});
```
Remember:
 - Each document is assigned a score within a predefined range, with the minimum being 0 and the maximum being 1.
 - The score field is configured to accept numerical values exclusively within the range of 0 to 1 (non-inclusive).

### Sorting results
 - Sorting Capability: With the `sortBy` method, users can now sort their search results alphabetically based on a specified string field.
 - Field Restriction: The `sortBy` function is designed to work with fields that are designated as strings in the schema.

After performing a search, users can chain the `sortBy` method to their search query. The method takes a string field name as an argument.

```js
const searchResults = vultos.search('search query', {
    fields: {
        title: { weight: 5 },
        author: { weight: 1 }
    },
    where: {
        year: { gt: 1900 }
    }
}).sortBy("title");
```

Important considerations:
 - Field Validation: `sortBy` only accepts fields that are designated as strings in the Vultos schema.
 - Error Handling: Attempting to sort by a non-string field or a field not present in the schema will result in an error.

# Search results
This section explains the format of the search results returned by Vultos, helping you understand the information provided for each hit.
 - `elapsed`: This field holds the time taken to complete the search in milliseconds. It can be valuable for gauging performance and optimizing your queries.
 - `count`: This field indicates the total number of documents matching your search query. It's helpful to know how many relevant results the search process identified.
 - `hits`: This is an array of individual search results, where each element represents a matched document. Each hit object contains:
   - `score`: This field holds the relevance score of the document for your query. Higher scores indicate a closer match to your search terms. Vultos uses a custom scoring algorithm considering factors like term frequency, field weights, and document length.
   - `document`: This object contains the full data of the matching document. It will reflect the same structure as the data you added through addDoc, including all defined fields and their values. This allows you to directly access the retrieved information.

```json
{
  "elapsed": 8.7,
  "count": 2,
  "hits": [
    {
      "score": 0.5555555555555556,
      "document": {
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "keywords": "american dream, jazz age, decadence, obsession, wealth, parties, long island, illusion vs reality, moral decay, unrequited love",
        "isAvailable": true,
        "year": 1925
      }
    },
    {
      "score": 0.2,
      "document": {
        "title": "Tarzan of the Apes",
        "author": "Edgar Rice Burroughs",
        "keywords": "jungle, wilderness, adventure, civilization vs nature, survival, identity, man vs beast, discovery, adaptation, isolation",
        "isAvailable": true,
        "year": 1912
      }
    }
  ]
}
```

Additional notes:
 - The isAvailable and year fields in the example may differ depending on your actual schema defined during Vultos initialization.
 - Remember, the returned document object always reflects the original data you added, excluding any temporary processing information like stemmed words or internal identifiers.

License
Vultos is licensed under the MIT License.
