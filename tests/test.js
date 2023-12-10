import { Vultus } from '../src/vultus.js';

const originalDocsOutput = document.getElementById('originalDocs');
const searchResultsOutput = document.getElementById('searchResults');
const searchBar = document.getElementById('searchBar');

const vultus = new Vultus({
    schema: {
        title: 'string',
        author: 'string',
        keywords: 'string',
        year: 'number'
    }
});

init();

function init() {
    let documents = [
        {
            "title": "1984",
            "author": "George Orwell",
            "keywords": "totalitarianism, surveillance, thoughtcrime, doublethink, newspeak, propaganda, rebellion, memory manipulation, oppression, control",
            "year": 1949
        },
        {
            "title": "The Iliad",
            "author": "Homer",
            "keywords": "war, honor, wrath, battle, heroism, fate, mortality, gods, conflict, glory",
            "year": -762
        },
        {
            "title": "Jane Eyre",
            "author": "Charlotte Bronte",
            "keywords": "gothic, love, romance, morality, independence, passion, mystery, redemption, social class, orphan",
            "year": 1847
        },
        {
            "title": "Dracula",
            "author": "Bram Stoker",
            "keywords": "vampire, gothic, horror, transylvania, blood, castle, seduction, fear, undeath, night",
            "year": 1897
        },
        {
            "title": "Treasure Island",
            "author": "Robert Louis Stevenson",
            "keywords": "adventure, pirates, treasure map, island, ship, mutiny, sea, buried gold, parrot, buccaneers",
            "year": 1883
        },
        {
            "title": "A Christmas Carol",
            "author": "Charles Dickens",
            "keywords": "redemption, ghosts, christmas, victorian, morality, past present and future, regret, generosity, transformation, festivity",
            "year": 1843
        },
        {
            "title": "A Tale of Two Cities",
            "author": "Charles Dickens",
            "keywords": "revolution, sacrifice, resurrection, dualities, injustice, guillotine, nobility, poverty, fate, love",
            "year": 1859
        },
        {
            "title": "Tarzan of the Apes",
            "author": "Edgar Rice Burroughs",
            "keywords": "jungle, wilderness, adventure, civilization vs nature, survival, identity, man vs beast, discovery, adaptation, isolation",
            "year": 1912
        },
        {
            "title": "The Great Gatsby",
            "author": "F. Scott Fitzgerald",
            "keywords": "american dream, jazz age, decadence, obsession, wealth, parties, long island, illusion vs reality, moral decay, unrequited love",
            "year": 1925
        },
        {
            "title": "The Odyssey",
            "author": "Homer",
            "keywords": "journey, heroism, adventure, gods, monsters, homecoming, loyalty, cunning, sea, fate",
            "year": -800
        },
        {
            "title": "Pride and Prejudice",
            "author": "Jane Austen",
            "keywords": "marriage, society, class, manners, courtship, prejudice, women, family, love, irony",
            "year": 1813
        },
        {
            "title": "The Picture of Dorian Gray",
            "author": "Oscar Wilde",
            "keywords": "aesthetics, morality, hedonism, beauty, youth, corruption, art, duality, vanity, supernatural",
            "year": 1890
        }
    ];
    

    for (let i = 0; i < documents.length; i++) {
        vultus.addDoc(documents[i]);
    }

    originalDocsOutput.textContent = JSON.stringify(vultus.docs, null, 2);
}

searchBar.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        console.clear();
        const searchQuery = searchBar.value;
        const searchResults = vultus.search(searchQuery, {
            fields: {
                title: { weight: 1 },
                author: { weight: 1 },
                keywords: { weight: 1 }
            }
        });
        searchResultsOutput.textContent = JSON.stringify(searchResults, null, 2);
    }
});