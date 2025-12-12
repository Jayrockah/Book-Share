// Comprehensive seed data with 10 users and 250+ fantasy books
// This file will be imported by MockDatabase.js

import { User, Book, generateUUID } from '../models/index';

export const createSeedData = () => {
    // Create 10 users with Nigerian names and cities
    const users = [
        new User({ id: generateUUID(), name: 'Chioma Adebayo', city: 'Lagos', reputation: 4.8, borrowLimit: 5 }),
        new User({ id: generateUUID(), name: 'Oluwaseun Okafor', city: 'Abuja', reputation: 4.6, borrowLimit: 5 }),
        new User({ id: generateUUID(), name: 'Amara Nwosu', city: 'Port Harcourt', reputation: 4.9, borrowLimit: 5 }),
        new User({ id: generateUUID(), name: 'Tunde Bakare', city: 'Ibadan', reputation: 4.7, borrowLimit: 5 }),
        new User({ id: generateUUID(), name: 'Ngozi Eze', city: 'Lagos', reputation: 4.5, borrowLimit: 5 }),
        new User({ id: generateUUID(), name: 'Emeka Okonkwo', city: 'Abuja', reputation: 4.8, borrowLimit: 5 }),
        new User({ id: generateUUID(), name: 'Fatima Bello', city: 'Kano', reputation: 4.6, borrowLimit: 5 }),
        new User({ id: generateUUID(), name: 'Chukwudi Nnamdi', city: 'Enugu', reputation: 4.7, borrowLimit: 5 }),
        new User({ id: generateUUID(), name: 'Aisha Mohammed', city: 'Port Harcourt', reputation: 4.9, borrowLimit: 5 }),
        new User({ id: generateUUID(), name: 'Admin User', city: 'Lagos', reputation: 5.0, borrowLimit: 10, isAdmin: true })
    ];

    // Create all 250 books WITHOUT owner assignment yet
    const allBooksData = [
        // Harry Potter series (7)
        { title: "Harry Potter and the Philosopher's Stone", author: "J.K. Rowling", genre: "Fantasy", condition: "Good", google_rating: 4.7, google_rating_count: 8234 },
        { title: "Harry Potter and the Chamber of Secrets", author: "J.K. Rowling", genre: "Fantasy", condition: "Good", google_rating: 4.6, google_rating_count: 5421 },
        { title: "Harry Potter and the Prisoner of Azkaban", author: "J.K. Rowling", genre: "Fantasy", condition: "Good", google_rating: 4.7, google_rating_count: 4832 },
        { title: "Harry Potter and the Goblet of Fire", author: "J.K. Rowling", genre: "Fantasy", condition: "New", google_rating: 4.6, google_rating_count: 4521 },
        { title: "Harry Potter and the Order of the Phoenix", author: "J.K. Rowling", genre: "Fantasy", condition: "Good", google_rating: 4.5, google_rating_count: 3982 },
        { title: "Harry Potter and the Half-Blood Prince", author: "J.K. Rowling", genre: "Fantasy", condition: "Good", google_rating: 4.6, google_rating_count: 3654 },
        { title: "Harry Potter and the Deathly Hallows", author: "J.K. Rowling", genre: "Fantasy", condition: "New", google_rating: 4.7, google_rating_count: 4123 },

        // Patrick Rothfuss (2)
        { title: "The Name of the Wind", author: "Patrick Rothfuss", genre: "Fantasy", condition: "New", google_rating: 4.5, google_rating_count: 2891 },
        { title: "The Wise Man's Fear", author: "Patrick Rothfuss", genre: "Fantasy", condition: "New", google_rating: 4.6, google_rating_count: 2234 },

        // Joe Abercrombie (3)
        { title: "The Blade Itself", author: "Joe Abercrombie", genre: "Fantasy", condition: "Good", google_rating: 4.2, google_rating_count: 1432 },
        { title: "Before They Are Hanged", author: "Joe Abercrombie", genre: "Fantasy", condition: "Good", google_rating: 4.3, google_rating_count: 982 },
        { title: "Last Argument of Kings", author: "Joe Abercrombie", genre: "Fantasy", condition: "Good", google_rating: 4.4, google_rating_count: 891 },

        // Scott Lynch (3)
        { title: "The Lies of Locke Lamora", author: "Scott Lynch", genre: "Fantasy", condition: "New", google_rating: 4.3, google_rating_count: 1756 },
        { title: "Red Seas Under Red Skies", author: "Scott Lynch", genre: "Fantasy", condition: "New", google_rating: 4.2, google_rating_count: 1123 },
        { title: "The Republic of Thieves", author: "Scott Lynch", genre: "Fantasy", condition: "Good", google_rating: 4.1, google_rating_count: 876 },

        // Steven Erikson - Malazan (10)
        { title: "Gardens of the Moon", author: "Steven Erikson", genre: "Fantasy", condition: "Good", google_rating: 3.9, google_rating_count: 1342 },
        { title: "Deadhouse Gates", author: "Steven Erikson", genre: "Fantasy", condition: "Good", google_rating: 4.3, google_rating_count: 892 },
        { title: "Memories of Ice", author: "Steven Erikson", genre: "Fantasy", condition: "Good", google_rating: 4.5, google_rating_count: 743 },
        { title: "House of Chains", author: "Steven Erikson", genre: "Fantasy", condition: "Worn", google_rating: 4.4, google_rating_count: 621 },
        { title: "Midnight Tides", author: "Steven Erikson", genre: "Fantasy", condition: "Worn", google_rating: 4.3, google_rating_count: 556 },
        { title: "The Bonehunters", author: "Steven Erikson", genre: "Fantasy", condition: "Good", google_rating: 4.6, google_rating_count: 512 },
        { title: "Reaper's Gale", author: "Steven Erikson", genre: "Fantasy", condition: "Good", google_rating: 4.4, google_rating_count: 467 },
        { title: "Toll the Hounds", author: "Steven Erikson", genre: "Fantasy", condition: "Good", google_rating: 4.3, google_rating_count: 423 },
        { title: "Dust of Dreams", author: "Steven Erikson", genre: "Fantasy", condition: "Good", google_rating: 4.2, google_rating_count: 389 },
        { title: "The Crippled God", author: "Steven Erikson", genre: "Fantasy", condition: "Good", google_rating: 4.7, google_rating_count: 521 },

        // LOTR + Hobbit + Tolkien (7)
        { title: "The Hobbit", author: "J.R.R. Tolkien", genre: "Fantasy", condition: "Good", google_rating: 4.7, google_rating_count: 6234 },
        { title: "The Fellowship of the Ring", author: "J.R.R. Tolkien", genre: "Fantasy", condition: "Good", google_rating: 4.5, google_rating_count: 4832 },
        { title: "The Two Towers", author: "J.R.R. Tolkien", genre: "Fantasy", condition: "Good", google_rating: 4.5, google_rating_count: 3921 },
        { title: "The Return of the King", author: "J.R.R. Tolkien", genre: "Fantasy", condition: "New", google_rating: 4.6, google_rating_count: 4123 },
        { title: "The Silmarillion", author: "J.R.R. Tolkien", genre: "Fantasy", condition: "Good", google_rating: 4.1, google_rating_count: 1567 },
        { title: "Unfinished Tales", author: "J.R.R. Tolkien", genre: "Fantasy", condition: "Worn", google_rating: 4.2, google_rating_count: 892 },
        { title: "The Children of Húrin", author: "J.R.R. Tolkien", genre: "Fantasy", condition: "Good", google_rating: 4.0, google_rating_count: 1123 },

        // Wheel of Time (15)
        { title: "The Eye of the World", author: "Robert Jordan", genre: "Fantasy", condition: "Good", google_rating: 4.2, google_rating_count: 2341 },
        { title: "The Great Hunt", author: "Robert Jordan", genre: "Fantasy", condition: "Good", google_rating: 4.3, google_rating_count: 1654 },
        { title: "The Dragon Reborn", author: "Robert Jordan", genre: "Fantasy", condition: "Good", google_rating: 4.3, google_rating_count: 1432 },
        { title: "The Shadow Rising", author: "Robert Jordan", genre: "Fantasy", condition: "Worn", google_rating: 4.5, google_rating_count: 1298 },
        { title: "The Fires of Heaven", author: "Robert Jordan", genre: "Fantasy", condition: "Worn", google_rating: 4.4, google_rating_count: 1123 },
        { title: "Lord of Chaos", author: "Robert Jordan", genre: "Fantasy", condition: "Good", google_rating: 4.4, google_rating_count: 1045 },
        { title: "A Crown of Swords", author: "Robert Jordan", genre: "Fantasy", condition: "Good", google_rating: 4.3, google_rating_count: 967 },
        { title: "The Path of Daggers", author: "Robert Jordan", genre: "Fantasy", condition: "Good", google_rating: 4.1, google_rating_count: 834 },
        { title: "Winter's Heart", author: "Robert Jordan", genre: "Fantasy", condition: "Good", google_rating: 4.2, google_rating_count: 765 },
        { title: "Crossroads of Twilight", author: "Robert Jordan", genre: "Fantasy", condition: "Worn", google_rating: 3.9, google_rating_count: 687 },
        { title: "Knife of Dreams", author: "Robert Jordan", genre: "Fantasy", condition: "Good", google_rating: 4.3, google_rating_count: 732 },
        { title: "The Gathering Storm", author: "Robert Jordan", genre: "Fantasy", condition: "New", google_rating: 4.5, google_rating_count: 1234 },
        { title: "Towers of Midnight", author: "Robert Jordan", genre: "Fantasy", condition: "New", google_rating: 4.4, google_rating_count: 1089 },
        { title: "A Memory of Light", author: "Robert Jordan", genre: "Fantasy", condition: "New", google_rating: 4.6, google_rating_count: 1456 },
        { title: "New Spring", author: "Robert Jordan", genre: "Fantasy", condition: "Good", google_rating: 4.0, google_rating_count: 623 },

        // Miscellaneous (3)
        { title: "The World of Robert Jordan's Wheel of Time", author: "Robert Jordan", genre: "Fantasy", condition: "Good", google_rating: 3.8, google_rating_count: 412 },
        { title: "River of Souls", author: "Robert Jordan", genre: "Fantasy", condition: "Good", google_rating: 4.1, google_rating_count: 298 },
        { title: "A Fire Upon the Deep", author: "Vernor Vinge", genre: "Science Fiction", condition: "Good", google_rating: 4.1, google_rating_count: 1432 },

        // Brandon Sanderson - Mistborn (6)
        { title: "Mistborn: The Final Empire", author: "Brandon Sanderson", genre: "Fantasy", condition: "New", google_rating: 4.4, google_rating_count: 3456 },
        { title: "The Well of Ascension", author: "Brandon Sanderson", genre: "Fantasy", condition: "New", google_rating: 4.3, google_rating_count: 2234 },
        { title: "The Hero of Ages", author: "Brandon Sanderson", genre: "Fantasy", condition: "New", google_rating: 4.5, google_rating_count: 2567 },
        { title: "The Alloy of Law", author: "Brandon Sanderson", genre: "Fantasy", condition: "Good", google_rating: 4.2, google_rating_count: 1432 },
        { title: "Shadows of Self", author: "Brandon Sanderson", genre: "Fantasy", condition: "Good", google_rating: 4.3, google_rating_count: 1123 },
        { title: "The Bands of Mourning", author: "Brandon Sanderson", genre: "Fantasy", condition: "New", google_rating: 4.4, google_rating_count: 1089 },

        // Warbreaker + Elantris (2)
        { title: "Warbreaker", author: "Brandon Sanderson", genre: "Fantasy", condition: "Good", google_rating: 4.3, google_rating_count: 2123 },
        { title: "Elantris", author: "Brandon Sanderson", genre: "Fantasy", condition: "Good", google_rating: 4.1, google_rating_count: 1876 },

        // R.F. Kuang (3)
        { title: "The Poppy War", author: "R.F. Kuang", genre: "Fantasy", condition: "New", google_rating: 4.2, google_rating_count: 2134 },
        { title: "The Dragon Republic", author: "R.F. Kuang", genre: "Fantasy", condition: "New", google_rating: 4.3, google_rating_count: 1567 },
        { title: "The Burning God", author: "R.F. Kuang", genre: "Fantasy", condition: "New", google_rating: 4.4, google_rating_count: 1234 },

        // Leigh Bardugo (6)
        { title: "Shadow and Bone", author: "Leigh Bardugo", genre: "Fantasy", condition: "Good", google_rating: 4.0, google_rating_count: 3456 },
        { title: "Siege and Storm", author: "Leigh Bardugo", genre: "Fantasy", condition: "Good", google_rating: 4.1, google_rating_count: 2345 },
        { title: "Ruin and Rising", author: "Leigh Bardugo", genre: "Fantasy", condition: "Good", google_rating: 4.2, google_rating_count: 2123 },
        { title: "Six of Crows", author: "Leigh Bardugo", genre: "Fantasy", condition: "New", google_rating: 4.5, google_rating_count: 4567 },
        { title: "Crooked Kingdom", author: "Leigh Bardugo", genre: "Fantasy", condition: "New", google_rating: 4.6, google_rating_count: 3987 },
        { title: "King of Scars", author: "Leigh Bardugo", genre: "Fantasy", condition: "Good", google_rating: 4.1, google_rating_count: 1876 },

        // V.E. Schwab (4)
        { title: "A Darker Shade of Magic", author: "V.E. Schwab", genre: "Fantasy", condition: "Good", google_rating: 4.1, google_rating_count: 2876 },
        { title: "A Gathering of Shadows", author: "V.E. Schwab", genre: "Fantasy", condition: "Good", google_rating: 4.2, google_rating_count: 1987 },
        { title: "A Conjuring of Light", author: "V.E. Schwab", genre: "Fantasy", condition: "New", google_rating: 4.3, google_rating_count: 1765 },
        { title: "Vicious", author: "V.E. Schwab", genre: "Fantasy", condition: "Good", google_rating: 4.1, google_rating_count: 2345 },

        // Stormlight Archive (4)
        { title: "The Way of Kings", author: "Brandon Sanderson", genre: "Fantasy", condition: "New", google_rating: 4.6, google_rating_count: 5432 },
        { title: "Words of Radiance", author: "Brandon Sanderson", genre: "Fantasy", condition: "New", google_rating: 4.7, google_rating_count: 4876 },
        { title: "Oathbringer", author: "Brandon Sanderson", genre: "Fantasy", condition: "New", google_rating: 4.6, google_rating_count: 3987 },
        { title: "Rhythm of War", author: "Brandon Sanderson", genre: "Fantasy", condition: "New", google_rating: 4.5, google_rating_count: 3234 },

        // More Sanderson (5)
        { title: "Skyward", author: "Brandon Sanderson", genre: "Science Fiction", condition: "Good", google_rating: 4.3, google_rating_count: 2456 },
        { title: "Starsight", author: "Brandon Sanderson", genre: "Science Fiction", condition: "Good", google_rating: 4.4, google_rating_count: 1876 },
        { title: "Cytonic", author: "Brandon Sanderson", genre: "Science Fiction", condition: "New", google_rating: 4.2, google_rating_count: 1234 },
        { title: "The Emperor's Soul", author: "Brandon Sanderson", genre: "Fantasy", condition: "Good", google_rating: 4.4, google_rating_count: 1654 },
        { title: "Legion", author: "Brandon Sanderson", genre: "Fantasy", condition: "Good", google_rating: 4.0, google_rating_count: 987 },

        // The Witcher (8)
        { title: "The Last Wish", author: "Andrzej Sapkowski", genre: "Fantasy", condition: "Good", google_rating: 4.2, google_rating_count: 3456 },
        { title: "Sword of Destiny", author: "Andrzej Sapkowski", genre: "Fantasy", condition: "Good", google_rating: 4.3, google_rating_count: 2345 },
        { title: "Blood of Elves", author: "Andrzej Sapkowski", genre: "Fantasy", condition: "Good", google_rating: 4.1, google_rating_count: 2876 },
        { title: "Time of Contempt", author: "Andrzej Sapkowski", genre: "Fantasy", condition: "Good", google_rating: 4.2, google_rating_count: 2123 },
        { title: "Baptism of Fire", author: "Andrzej Sapkowski", genre: "Fantasy", condition: "Good", google_rating: 4.3, google_rating_count: 1876 },
        { title: "The Tower of Swallows", author: "Andrzej Sapkowski", genre: "Fantasy", condition: "Worn", google_rating: 4.2, google_rating_count: 1654 },
        { title: "Lady of the Lake", author: "Andrzej Sapkowski", genre: "Fantasy", condition: "Worn", google_rating: 4.3, google_rating_count: 1567 },
        { title: "Season of Storms", author: "Andrzej Sapkowski", genre: "Fantasy", condition: "Good", google_rating: 4.0, google_rating_count: 1234 },

        // Brent Weeks (9)
        { title: "The Way of Shadows", author: "Brent Weeks", genre: "Fantasy", condition: "Good", google_rating: 4.2, google_rating_count: 2876 },
        { title: "Shadow's Edge", author: "Brent Weeks", genre: "Fantasy", condition: "Good", google_rating: 4.3, google_rating_count: 2123 },
        { title: "Beyond the Shadows", author: "Brent Weeks", genre: "Fantasy", condition: "Good", google_rating: 4.3, google_rating_count: 1876 },
        { title: "The Black Prism", author: "Brent Weeks", genre: "Fantasy", condition: "New", google_rating: 4.2, google_rating_count: 2456 },
        { title: "The Blinding Knife", author: "Brent Weeks", genre: "Fantasy", condition: "New", google_rating: 4.4, google_rating_count: 2123 },
        { title: "The Broken Eye", author: "Brent Weeks", genre: "Fantasy", condition: "Good", google_rating: 4.3, google_rating_count: 1765 },
        { title: "The Blood Mirror", author: "Brent Weeks", genre: "Fantasy", condition: "Good", google_rating: 4.3, google_rating_count: 1543 },
        { title: "The Burning White", author: "Brent Weeks", genre: "Fantasy", condition: "New", google_rating: 4.4, google_rating_count: 1876 },
        { title: "Perfect Shadow", author: "Brent Weeks", genre: "Fantasy", condition: "Good", google_rating: 3.9, google_rating_count: 765 },

        // Mark Lawrence (8)
        { title: "Prince of Thorns", author: "Mark Lawrence", genre: "Fantasy", condition: "Good", google_rating: 4.0, google_rating_count: 2234 },
        { title: "King of Thorns", author: "Mark Lawrence", genre: "Fantasy", condition: "Good", google_rating: 4.1, google_rating_count: 1765 },
        { title: "Emperor of Thorns", author: "Mark Lawrence", genre: "Fantasy", condition: "Good", google_rating: 4.2, google_rating_count: 1543 },
        { title: "Prince of Fools", author: "Mark Lawrence", genre: "Fantasy", condition: "Good", google_rating: 4.1, google_rating_count: 1432 },
        { title: "The Liar's Key", author: "Mark Lawrence", genre: "Fantasy", condition: "Good", google_rating: 4.2, google_rating_count: 1234 },
        { title: "The Wheel of Osheim", author: "Mark Lawrence", genre: "Fantasy", condition: "Good", google_rating: 4.2, google_rating_count: 1098 },
        { title: "Red Sister", author: "Mark Lawrence", genre: "Fantasy", condition: "New", google_rating: 4.2, google_rating_count: 1876 },
        { title: "Grey Sister", author: "Mark Lawrence", genre: "Fantasy", condition: "New", google_rating: 4.3, google_rating_count: 1543 },

        // N.K. Jemisin (9)
        { title: "The Fifth Season", author: "N.K. Jemisin", genre: "Fantasy", condition: "New", google_rating: 4.3, google_rating_count: 3876 },
        { title: "The Obelisk Gate", author: "N.K. Jemisin", genre: "Fantasy", condition: "New", google_rating: 4.4, google_rating_count: 2987 },
        { title: "The Stone Sky", author: "N.K. Jemisin", genre: "Fantasy", condition: "New", google_rating: 4.5, google_rating_count: 2765 },
        { title: "The Hundred Thousand Kingdoms", author: "N.K. Jemisin", genre: "Fantasy", condition: "Good", google_rating: 4.0, google_rating_count: 2456 },
        { title: "The Broken Kingdoms", author: "N.K. Jemisin", genre: "Fantasy", condition: "Good", google_rating: 4.1, google_rating_count: 1876 },
        { title: "The Kingdom of Gods", author: "N.K. Jemisin", genre: "Fantasy", condition: "Good", google_rating: 4.2, google_rating_count: 1654 },
        { title: "The City We Became", author: "N.K. Jemisin", genre: "Fantasy", condition: "New", google_rating: 4.0, google_rating_count: 2234 },
        { title: "How Long 'til Black Future Month?", author: "N.K. Jemisin", genre: "Fantasy", condition: "Good", google_rating: 4.2, google_rating_count: 1432 },
        { title: "The Awakened Kingdom", author: "N.K. Jemisin", genre: "Fantasy", condition: "Good", google_rating: 3.9, google_rating_count: 876 },

        // Nnedi Okorafor (16)
        { title: "Who Fears Death", author: "Nnedi Okorafor", genre: "Fantasy", condition: "Good", google_rating: 4.0, google_rating_count: 1987 },
        { title: "The Book of Phoenix", author: "Nnedi Okorafor", genre: "Fantasy", condition: "Good", google_rating: 3.9, google_rating_count: 1234 },
        { title: "Binti", author: "Nnedi Okorafor", genre: "Science Fiction", condition: "New", google_rating: 4.1, google_rating_count: 2345 },
        { title: "Binti: Home", author: "Nnedi Okorafor", genre: "Science Fiction", condition: "New", google_rating: 4.0, google_rating_count: 1543 },
        { title: "Binti: The Night Masquerade", author: "Nnedi Okorafor", genre: "Science Fiction", condition: "New", google_rating: 4.0, google_rating_count: 1234 },
        { title: "Akata Witch", author: "Nnedi Okorafor", genre: "Fantasy", condition: "Good", google_rating: 4.1, google_rating_count: 2876 },
        { title: "Akata Warrior", author: "Nnedi Okorafor", genre: "Fantasy", condition: "Good", google_rating: 4.2, google_rating_count: 1876 },
        { title: "Lagoon", author: "Nnedi Okorafor", genre: "Science Fiction", condition: "Good", google_rating: 3.8, google_rating_count: 1654 },
        { title: "Zahrah the Windseeker", author: "Nnedi Okorafor", genre: "Fantasy", condition: "Good", google_rating: 4.0, google_rating_count: 876 },
        { title: "The Shadow Speaker", author: "Nnedi Okorafor", genre: "Fantasy", condition: "Good", google_rating: 3.9, google_rating_count: 765 },
        { title: "Long Juju Man", author: "Nnedi Okorafor", genre: "Fantasy", condition: "Worn", google_rating: 3.8, google_rating_count: 543 },
        { title: "Kabu Kabu", author: "Nnedi Okorafor", genre: "Fantasy", condition: "Good", google_rating: 3.9, google_rating_count: 654 },
        { title: "Remote Control", author: "Nnedi Okorafor", genre: "Science Fiction", condition: "New", google_rating: 4.0, google_rating_count: 1432 },
        { title: "Noor", author: "Nnedi Okorafor", genre: "Science Fiction", condition: "New", google_rating: 3.9, google_rating_count: 987 },
        { title: "Iridessa", author: "Nnedi Okorafor", genre: "Fantasy", condition: "Good", google_rating: 3.8, google_rating_count: 432 },
        { title: "Spider the Artist", author: "Nnedi Okorafor", genre: "Fantasy", condition: "Good", google_rating: 3.8, google_rating_count: 321 },

        // Inheritance Cycle (4)
        { title: "Eragon", author: "Christopher Paolini", genre: "Fantasy", condition: "Good", google_rating: 4.1, google_rating_count: 4567 },
        { title: "Eldest", author: "Christopher Paolini", genre: "Fantasy", condition: "Good", google_rating: 4.0, google_rating_count: 3234 },
        { title: "Brisingr", author: "Christopher Paolini", genre: "Fantasy", condition: "Good", google_rating: 4.1, google_rating_count: 2876 },
        { title: "Inheritance", author: "Christopher Paolini", genre: "Fantasy", condition: "New", google_rating: 4.2, google_rating_count: 2543 },

        // Ender's Game (6)
        { title: "Ender's Game", author: "Orson Scott Card", genre: "Science Fiction", condition: "Good", google_rating: 4.3, google_rating_count: 5432 },
        { title: "Speaker for the Dead", author: "Orson Scott Card", genre: "Science Fiction", condition: "Good", google_rating: 4.2, google_rating_count: 3456 },
        { title: "Xenocide", author: "Orson Scott Card", genre: "Science Fiction", condition: "Good", google_rating: 4.0, google_rating_count: 2345 },
        { title: "Children of the Mind", author: "Orson Scott Card", genre: "Science Fiction", condition: "Good", google_rating: 3.9, google_rating_count: 1876 },
        { title: "Ender's Shadow", author: "Orson Scott Card", genre: "Science Fiction", condition: "Good", google_rating: 4.3, google_rating_count: 3234 },
        { title: "Shadow of the Hegemon", author: "Orson Scott Card", genre: "Science Fiction", condition: "Good", google_rating: 4.1, google_rating_count: 2123 },

        // Hunger Games + Divergent (9)
        { title: "The Hunger Games", author: "Suzanne Collins", genre: "Young Adult", condition: "Good", google_rating: 4.3, google_rating_count: 6543 },
        { title: "Catching Fire", author: "Suzanne Collins", genre: "Young Adult", condition: "Good", google_rating: 4.4, google_rating_count: 5432 },
        { title: "Mockingjay", author: "Suzanne Collins", genre: "Young Adult", condition: "Good", google_rating: 4.1, google_rating_count: 4567 },
        { title: "The Ballad of Songbirds and Snakes", author: "Suzanne Collins", genre: "Young Adult", condition: "New", google_rating: 4.0, google_rating_count: 3876 },
        { title: "Divergent", author: "Veronica Roth", genre: "Young Adult", condition: "Good", google_rating: 4.2, google_rating_count: 5678 },
        { title: "Insurgent", author: "Veronica Roth", genre: "Young Adult", condition: "Good", google_rating: 4.0, google_rating_count: 4321 },
        { title: "Allegiant", author: "Veronica Roth", genre: "Young Adult", condition: "Good", google_rating: 3.8, google_rating_count: 3456 },
        { title: "Four", author: "Veronica Roth", genre: "Young Adult", condition: "Good", google_rating: 4.1, google_rating_count: 2876 },
        { title: "Gregor the Overlander", author: "Suzanne Collins", genre: "Young Adult", condition: "Good", google_rating: 4.2, google_rating_count: 2345 },

        // Game of Thrones (5)
        { title: "A Game of Thrones", author: "George R.R. Martin", genre: "Fantasy", condition: "Good", google_rating: 4.5, google_rating_count: 8765 },
        { title: "A Clash of Kings", author: "George R.R. Martin", genre: "Fantasy", condition: "Good", google_rating: 4.4, google_rating_count: 6543 },
        { title: "A Storm of Swords", author: "George R.R. Martin", genre: "Fantasy", condition: "Good", google_rating: 4.6, google_rating_count: 6234 },
        { title: "A Feast for Crows", author: "George R.R. Martin", genre: "Fantasy", condition: "Worn", google_rating: 4.2, google_rating_count: 4321 },
        { title: "A Dance with Dragons", author: "George R.R. Martin", genre: "Fantasy", condition: "Good", google_rating: 4.3, google_rating_count: 4876 },

        // Robin Hobb (20)
        { title: "Assassin's Apprentice", author: "Robin Hobb", genre: "Fantasy", condition: "Good", google_rating: 4.2, google_rating_count: 3456 },
        { title: "Royal Assassin", author: "Robin Hobb", genre: "Fantasy", condition: "Good", google_rating: 4.3, google_rating_count: 2876 },
        { title: "Assassin's Quest", author: "Robin Hobb", genre: "Fantasy", condition: "Good", google_rating: 4.4, google_rating_count: 2654 },
        { title: "Ship of Magic", author: "Robin Hobb", genre: "Fantasy", condition: "Good", google_rating: 4.1, google_rating_count: 2123 },
        { title: "The Mad Ship", author: "Robin Hobb", genre: "Fantasy", condition: "Good", google_rating: 4.2, google_rating_count: 1876 },
        { title: "Ship of Destiny", author: "Robin Hobb", genre: "Fantasy", condition: "Good", google_rating: 4.3, google_rating_count: 1765 },
        { title: "Fool's Errand", author: "Robin Hobb", genre: "Fantasy", condition: "Good", google_rating: 4.3, google_rating_count: 2345 },
        { title: "The Golden Fool", author: "Robin Hobb", genre: "Fantasy", condition: "Good", google_rating: 4.3, google_rating_count: 2123 },
        { title: "Fool's Fate", author: "Robin Hobb", genre: "Fantasy", condition: "Good", google_rating: 4.4, google_rating_count: 2234 },
        { title: "Dragon Keeper", author: "Robin Hobb", genre: "Fantasy", condition: "Good", google_rating: 4.0, google_rating_count: 1654 },
        { title: "Dragon Haven", author: "Robin Hobb", genre: "Fantasy", condition: "Good", google_rating: 4.1, google_rating_count: 1432 },
        { title: "City of Dragons", author: "Robin Hobb", genre: "Fantasy", condition: "Good", google_rating: 4.1, google_rating_count: 1321 },
        { title: "Blood of Dragons", author: "Robin Hobb", genre: "Fantasy", condition: "Good", google_rating: 4.2, google_rating_count: 1234 },
        { title: "Fool's Assassin", author: "Robin Hobb", genre: "Fantasy", condition: "New", google_rating: 4.3, google_rating_count: 2567 },
        { title: "Fool's Quest", author: "Robin Hobb", genre: "Fantasy", condition: "New", google_rating: 4.4, google_rating_count: 2345 },
        { title: "Assassin's Fate", author: "Robin Hobb", genre: "Fantasy", condition: "New", google_rating: 4.5, google_rating_count: 2876 },
        { title: "The Wilful Princess and the Piebald Prince", author: "Robin Hobb", genre: "Fantasy", condition: "Good", google_rating: 3.9, google_rating_count: 876 },
        { title: "The Inheritance", author: "Robin Hobb", genre: "Fantasy", condition: "Good", google_rating: 4.0, google_rating_count: 765 },
        { title: "Cat's Meat", author: "Robin Hobb", genre: "Fantasy", condition: "Worn", google_rating: 3.8, google_rating_count: 543 },
        { title: "Homecoming", author: "Robin Hobb", genre: "Fantasy", condition: "Good", google_rating: 3.9, google_rating_count: 654 },

        // Narnia (7)
        { title: "The Lion, the Witch and the Wardrobe", author: "C.S. Lewis", genre: "Fantasy", condition: "Good", google_rating: 4.2, google_rating_count: 5432 },
        { title: "Prince Caspian", author: "C.S. Lewis", genre: "Fantasy", condition: "Good", google_rating: 4.0, google_rating_count: 3456 },
        { title: "The Voyage of the Dawn Treader", author: "C.S. Lewis", genre: "Fantasy", condition: "Good", google_rating: 4.1, google_rating_count: 3234 },
        { title: "The Silver Chair", author: "C.S. Lewis", genre: "Fantasy", condition: "Good", google_rating: 4.0, google_rating_count: 2876 },
        { title: "The Horse and His Boy", author: "C.S. Lewis", genre: "Fantasy", condition: "Good", google_rating: 4.0, google_rating_count: 2654 },
        { title: "The Magician's Nephew", author: "C.S. Lewis", genre: "Fantasy", condition: "Good", google_rating: 4.1, google_rating_count: 3123 },
        { title: "The Last Battle", author: "C.S. Lewis", genre: "Fantasy", condition: "Good", google_rating: 3.9, google_rating_count: 2456 },

        // His Dark Materials (3)
        { title: "The Golden Compass", author: "Philip Pullman", genre: "Fantasy", condition: "Good", google_rating: 4.0, google_rating_count: 4567 },
        { title: "The Subtle Knife", author: "Philip Pullman", genre: "Fantasy", condition: "Good", google_rating: 4.1, google_rating_count: 3456 },
        { title: "The Amber Spyglass", author: "Philip Pullman", genre: "Fantasy", condition: "Good", google_rating: 4.0, google_rating_count: 3234 },

        // Percy Jackson (10)
        { title: "The Lightning Thief", author: "Rick Riordan", genre: "Young Adult", condition: "Good", google_rating: 4.3, google_rating_count: 5678 },
        { title: "The Sea of Monsters", author: "Rick Riordan", genre: "Young Adult", condition: "Good", google_rating: 4.2, google_rating_count: 4321 },
        { title: "The Titan's Curse", author: "Rick Riordan", genre: "Young Adult", condition: "Good", google_rating: 4.3, google_rating_count: 4123 },
        { title: "The Battle of the Labyrinth", author: "Rick Riordan", genre: "Young Adult", condition: "Good", google_rating: 4.4, google_rating_count: 3987 },
        { title: "The Last Olympian", author: "Rick Riordan", genre: "Young Adult", condition: "Good", google_rating: 4.5, google_rating_count: 4234 },
        { title: "The Lost Hero", author: "Rick Riordan", genre: "Young Adult", condition: "Good", google_rating: 4.2, google_rating_count: 3765 },
        { title: "The Son of Neptune", author: "Rick Riordan", genre: "Young Adult", condition: "Good", google_rating: 4.3, google_rating_count: 3543 },
        { title: "The Mark of Athena", author: "Rick Riordan", genre: "Young Adult", condition: "New", google_rating: 4.4, google_rating_count: 3876 },
        { title: "The House of Hades", author: "Rick Riordan", genre: "Young Adult", condition: "New", google_rating: 4.5, google_rating_count: 3654 },
        { title: "The Blood of Olympus", author: "Rick Riordan", genre: "Young Adult", condition: "New", google_rating: 4.3, google_rating_count: 3234 },

        // Earthsea (6)
        { title: "A Wizard of Earthsea", author: "Ursula K. Le Guin", genre: "Fantasy", condition: "Good", google_rating: 4.0, google_rating_count: 3456 },
        { title: "The Tombs of Atuan", author: "Ursula K. Le Guin", genre: "Fantasy", condition: "Good", google_rating: 4.1, google_rating_count: 2345 },
        { title: "The Farthest Shore", author: "Ursula K. Le Guin", genre: "Fantasy", condition: "Good", google_rating: 4.0, google_rating_count: 2123 },
        { title: "Tehanu", author: "Ursula K. Le Guin", genre: "Fantasy", condition: "Good", google_rating: 3.9, google_rating_count: 1876 },
        { title: "Tales from Earthsea", author: "Ursula K. Le Guin", genre: "Fantasy", condition: "Good", google_rating: 4.0, google_rating_count: 1654 },
        { title: "The Other Wind", author: "Ursula K. Le Guin", genre: "Fantasy", condition: "Good", google_rating: 4.1, google_rating_count: 1543 },

        // Dune (6)
        { title: "Dune", author: "Frank Herbert", genre: "Science Fiction", condition: "Good", google_rating: 4.3, google_rating_count: 7654 },
        { title: "Dune Messiah", author: "Frank Herbert", genre: "Science Fiction", condition: "Good", google_rating: 3.9, google_rating_count: 4321 },
        { title: "Children of Dune", author: "Frank Herbert", genre: "Science Fiction", condition: "Good", google_rating: 4.0, google_rating_count: 3456 },
        { title: "God Emperor of Dune", author: "Frank Herbert", genre: "Science Fiction", condition: "Worn", google_rating: 3.9, google_rating_count: 2876 },
        { title: "Heretics of Dune", author: "Frank Herbert", genre: "Science Fiction", condition: "Worn", google_rating: 3.8, google_rating_count: 2345 },
        { title: "Chapterhouse: Dune", author: "Frank Herbert", genre: "Science Fiction", condition: "Good", google_rating: 3.8, google_rating_count: 2123 },

        // Foundation (7)
        { title: "Foundation", author: "Isaac Asimov", genre: "Science Fiction", condition: "Good", google_rating: 4.2, google_rating_count: 5432 },
        { title: "Foundation and Empire", author: "Isaac Asimov", genre: "Science Fiction", condition: "Good", google_rating: 4.2, google_rating_count: 4123 },
        { title: "Second Foundation", author: "Isaac Asimov", genre: "Science Fiction", condition: "Good", google_rating: 4.3, google_rating_count: 3876 },
        { title: "Foundation's Edge", author: "Isaac Asimov", genre: "Science Fiction", condition: "Good", google_rating: 4.1, google_rating_count: 3234 },
        { title: "Foundation and Earth", author: "Isaac Asimov", genre: "Science Fiction", condition: "Good", google_rating: 4.0, google_rating_count: 2876 },
        { title: "Prelude to Foundation", author: "Isaac Asimov", genre: "Science Fiction", condition: "Good", google_rating: 4.1, google_rating_count: 2654 },
        { title: "Forward the Foundation", author: "Isaac Asimov", genre: "Science Fiction", condition: "Good", google_rating: 4.2, google_rating_count: 2456 },

        // More Asimov (6)
        { title: "I, Robot", author: "Isaac Asimov", genre: "Science Fiction", condition: "Good", google_rating: 4.2, google_rating_count: 4567 },
        { title: "The Caves of Steel", author: "Isaac Asimov", genre: "Science Fiction", condition: "Good", google_rating: 4.1, google_rating_count: 2876 },
        { title: "The Naked Sun", author: "Isaac Asimov", genre: "Science Fiction", condition: "Good", google_rating: 4.1, google_rating_count: 2345 },
        { title: "The Robots of Dawn", author: "Isaac Asimov", genre: "Science Fiction", condition: "Good", google_rating: 4.0, google_rating_count: 2123 },
        { title: "Robots and Empire", author: "Isaac Asimov", genre: "Science Fiction", condition: "Good", google_rating: 4.1, google_rating_count: 1987 },
        { title: "The Gods Themselves", author: "Isaac Asimov", genre: "Science Fiction", condition: "Good", google_rating: 4.0, google_rating_count: 2234 }
    ];

    // Sort all books by quality: rating DESC (nulls last), then count DESC
    const sortedBooks = [...allBooksData].sort((a, b) => {
        const ra = typeof a.google_rating === 'number' ? a.google_rating : -1;
        const rb = typeof b.google_rating === 'number' ? b.google_rating : -1;

        if (rb !== ra) return rb - ra;

        const ca = a.google_rating_count || 0;
        const cb = b.google_rating_count || 0;

        return cb - ca;
    });

    // Round-robin assignment to users
    const books = sortedBooks.map((bookData, index) => {
        const userIndex = index % users.length;
        return new Book({
            ...bookData,
            id: generateUUID(),
            ownerId: users[userIndex].id
        });
    });

    return { users, books };
};
