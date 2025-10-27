import Subject from "../models/subject.model.js";
import Module from "../models/module.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";

/**
 * GET /api/v1/subjects
 */
const getSubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.find().populate({
    path: "modules",
    select: "title order seedTopic youtubeLinks"
  }).sort({ displayOrder: 1, title: 1 });

  return res.status(200).json(new apiResponse(200, { subjects }, "Subjects retrieved"));
});

/**
 * GET /api/v1/subjects/:id
 */
const getSubjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const subject = await Subject.findById(id).populate({
    path: "modules",
    options: { sort: { order: 1 } }
  });

  if (!subject) {
    throw new apiError(404, "Subject not found");
  }

  return res.status(200).json(new apiResponse(200, { subject }, "Subject retrieved"));
});

/**
 * POST /api/v1/subjects/seed
 * Seed sample subjects & modules for C++ and OOP. Run once.
 */
const seedSubjects = asyncHandler(async (req, res) => {
    // Using Promise.all to run seed operations in parallel for efficiency
    await Promise.all([
        seedCppSubject(),
        seedOopSubject(),
        seedDsaSubject(),
        seedJavaSubject(),
        seedPythonSubject(),
        seedCnSubject(),
        seedDbmsSubject(),
        seedOsSubject()
    ]);

    const allSubjects = await Subject.find().populate('modules');
    return res.status(201).json(new apiResponse(201, { subjects: allSubjects }, "Seed completed successfully"));
});

// Helper function to seed the C++ subject
async function seedCppSubject() {
    const existing = await Subject.findOne({ key: "cpp" });
    if (existing) {
        console.log("C++ subject already exists. Skipping.");
        return;
    }

    const subject = await Subject.create({ key: "cpp", title: "C++ Programming", modules: [], displayOrder: 1 });
    const moduleData = [
        {
            order: 1,
            title: "Intro to C++",
            seedTopic: "History & setup, structure of a C++ program",
            subjectId: subject._id,
            youtubeLinks: [
                "https://www.youtube.com/watch?v=TVXEfw6Nrjk&list=PLxCzCOWd7aiF6yRNI5OHQsnUJQfl7Geqj&index=3", 
                "https://www.youtube.com/watch?v=fi2InG7csKo&list=PLxCzCOWd7aiF6yRNI5OHQsnUJQfl7Geqj&index=4",
                "https://www.youtube.com/watch?v=SeR2aDYoJAI&list=PLxCzCOWd7aiF6yRNI5OHQsnUJQfl7Geqj&index=6"  // What Is C++? (Programming with Mosh)
            ]
        },
        {
            order: 2,
            title: "Variables & Types",
            seedTopic: "Primitive types, variables, constants in C++",
            subjectId: subject._id,
            youtubeLinks: [
                "https://www.youtube.com/watch?v=pJTZTHMDuB0&list=PLxCzCOWd7aiF6yRNI5OHQsnUJQfl7Geqj&index=8", // Example Link 1
                "https://www.youtube.com/watch?v=AquOdf9orxg&list=PLxCzCOWd7aiF6yRNI5OHQsnUJQfl7Geqj&index=9" // Example Link 2
            ]
        },
        {
            order: 3,
            title: "Control Flow",
            seedTopic: "if/else, loops, switch statements in C++",
            subjectId: subject._id,
            youtubeLinks: [
                "https://www.youtube.com/watch?v=PnV4e9lbiM4&list=PLxCzCOWd7aiF6yRNI5OHQsnUJQfl7Geqj&index=21",
                "https://www.youtube.com/watch?v=NG0Iw6xNO0s&list=PLxCzCOWd7aiF6yRNI5OHQsnUJQfl7Geqj&index=22",
                "https://youtu.be/2BYSfp08ET4?list=PLxCzCOWd7aiF6yRNI5OHQsnUJQfl7Geqj" // Example Link 1
            ]
        },
        {
            order: 4,
            title: "Functions",
            seedTopic: "Function declaration, parameters, return values in C++",
            subjectId: subject._id,
            youtubeLinks: [
                "https://youtu.be/7ThRtb-EMh8?list=PLxCzCOWd7aiF6yRNI5OHQsnUJQfl7Geqj",
                "https://youtu.be/1HYbufxsE2c?list=PLxCzCOWd7aiF6yRNI5OHQsnUJQfl7Geqj" // Example Link 1
            ]
        },
        {
            order: 5,
            title: "Pointers",
            seedTopic: "Pointers, references, and basics of memory management in C++",
            subjectId: subject._id,
            youtubeLinks: [
                "https://youtu.be/ecePzBvAMKg?list=PLxCzCOWd7aiF6yRNI5OHQsnUJQfl7Geqj", // Example Link 1
                "https://www.youtube.com/watch?v=q6_lN-CQN2s" // Example Link 2
            ]
        },
    ];
    const createdModules = await Module.insertMany(moduleData);
    subject.modules = createdModules.map(m => m._id);
    await subject.save();
    console.log("C++ subject seeded successfully.");
}

// Helper function to seed the OOP subject
async function seedOopSubject() {
    const existing = await Subject.findOne({ key: "oop" });
    if (existing) {
        console.log("OOP subject already exists. Skipping.");
        return;
    }

    const subject = await Subject.create({ key: "oop", title: "Object-Oriented Programming", modules: [], displayOrder: 2 });
    const moduleData = [
        {
            order: 1,
            title: "Core OOP Concepts",
            seedTopic: "Introduction to Encapsulation, Abstraction, Inheritance, and Polymorphism",
            subjectId: subject._id,
            youtubeLinks: [
                "https://www.youtube.com/watch?v=pTB0EiLXUC8", // Object-oriented Programming in 7 minutes (Mosh)
                "https://youtu.be/zCja0Jd52KU?list=PLxCzCOWd7aiF6yRNI5OHQsnUJQfl7Geqj"  // OOP Explained (CodeWithHarry - Hindi)
            ]
        },
        {
            order: 2,
            title: "Classes and Objects",
            seedTopic: "Defining classes, creating objects, constructors, and destructors",
            subjectId: subject._id,
            youtubeLinks: [
                "https://youtu.be/TOG6xCEJU3M?list=PLxCzCOWd7aiF6yRNI5OHQsnUJQfl7Geqj",
                "https://youtu.be/aD6uxHWec-E?list=PLxCzCOWd7aiF6yRNI5OHQsnUJQfl7Geqj",
                "https://youtu.be/XM97u2vhWtI?list=PLxCzCOWd7aiF6yRNI5OHQsnUJQfl7Geqj" // Example Link 1
            ]
        },
        {
            order: 3,
            title: "Inheritance",
            seedTopic: "Types of inheritance, base and derived classes, access control",
            subjectId: subject._id,
            youtubeLinks: [
                "https://youtu.be/ipd4SQY0Ehg?list=PLxCzCOWd7aiF6yRNI5OHQsnUJQfl7Geqj",
                "https://youtu.be/2sN_GoaLmMw?list=PLxCzCOWd7aiF6yRNI5OHQsnUJQfl7Geqj" // Example Link 1
            ]
        },
        {
            order: 4,
            title: "Polymorphism",
            seedTopic: "Function overloading, virtual functions, and runtime polymorphism",
            subjectId: subject._id,
            youtubeLinks: [
                "https://youtu.be/rnYOshIg7mU?list=PLxCzCOWd7aiF6yRNI5OHQsnUJQfl7Geqj",
                "https://youtu.be/iUXwbydT2J4?list=PLxCzCOWd7aiF6yRNI5OHQsnUJQfl7Geqj" // Example Link 1
            ]
        },
    ];
    const createdModules = await Module.insertMany(moduleData);
    subject.modules = createdModules.map(m => m._id);
    await subject.save();
    console.log("OOP subject seeded successfully.");
}

async function seedDsaSubject() {
    const existing = await Subject.findOne({ key: "dsa" });
    if (existing) {
        console.log("DSA subject already exists. Skipping.");
        return;
    }
    const subject = await Subject.create({ key: "dsa", title: "Data Structures & Algorithms", modules: [] });
    const moduleData = [
        { order: 1, title: "Algorithm Analysis", seedTopic: "Asymptotic notations (Big O, Big Omega, Big Theta), time and space complexity analysis, recurrence relations", subjectId: subject._id },
        { order: 2, title: "Arrays", seedTopic: "Basic operations, dynamic arrays, multi-dimensional arrays, common array-based problems", subjectId: subject._id },
        { order: 3, title: "Linked Lists", seedTopic: "Singly linked lists, doubly linked lists, circular linked lists, operations (insertion, deletion, traversal), applications", subjectId: subject._id },
        { order: 4, title: "Stacks", seedTopic: "LIFO principle, operations (push, pop, peek), implementation (array, linked list), applications (expression evaluation, recursion)", subjectId: subject._id },
        { order: 5, title: "Queues", seedTopic: "FIFO principle, operations (enqueue, dequeue), implementation (array, linked list), Circular Queues, Priority Queues, Deques", subjectId: subject._id },
        { order: 6, title: "Trees - Basics", seedTopic: "Tree terminology, Binary Trees, Binary Search Trees (BST), operations (insertion, deletion, search), traversals (inorder, preorder, postorder)", subjectId: subject._id },
        { order: 7, title: "Trees - Advanced", seedTopic: "AVL Trees, Red-Black Trees, B-Trees, Heaps (Min-Heap, Max-Heap), Heap Sort", subjectId: subject._id },
        { order: 8, title: "Hashing", seedTopic: "Hash functions, collision resolution techniques (chaining, open addressing), applications", subjectId: subject._id },
        { order: 9, title: "Graphs", seedTopic: "Graph representations (adjacency matrix, adjacency list), traversals (BFS, DFS), shortest path algorithms (Dijkstra, Bellman-Ford), Minimum Spanning Trees (Prim's, Kruskal's)", subjectId: subject._id },
        { order: 10, title: "Searching Algorithms", seedTopic: "Linear Search, Binary Search (iterative and recursive)", subjectId: subject._id },
        { order: 11, title: "Sorting Algorithms", seedTopic: "Bubble Sort, Selection Sort, Insertion Sort, Merge Sort, Quick Sort, Heap Sort, Counting Sort, Radix Sort", subjectId: subject._id },
        { order: 12, title: "Greedy Algorithms", seedTopic: "Concept of greedy approach, examples (Activity Selection, Huffman Coding, Fractional Knapsack)", subjectId: subject._id },
        { order: 13, title: "Dynamic Programming", seedTopic: "Concept of overlapping subproblems and optimal substructure, memoization vs tabulation, examples (Fibonacci, Longest Common Subsequence, 0/1 Knapsack)", subjectId: subject._id },
        { order: 14, title: "Divide and Conquer", seedTopic: "Concept of divide and conquer, examples (Merge Sort, Quick Sort, Binary Search)", subjectId: subject._id },
    ];
    const createdModules = await Module.insertMany(moduleData);
    subject.modules = createdModules.map(m => m._id);
    await subject.save();
    console.log("DSA subject seeded successfully.");
}

async function seedJavaSubject() {
    const existing = await Subject.findOne({ key: "java" });
    if (existing) {
        console.log("Java subject already exists. Skipping.");
        return;
    }
    const subject = await Subject.create({ key: "java", title: "Java Programming", modules: [] });
    const moduleData = [
        { order: 1, title: "Java Basics", seedTopic: "JVM, JDK, JRE, basic syntax, data types, variables, operators, type casting", subjectId: subject._id },
        { order: 2, title: "Control Flow", seedTopic: "Conditional statements (if-else, switch), loops (for, while, do-while), break, continue", subjectId: subject._id },
        { order: 3, title: "Arrays & Strings", seedTopic: "Declaring, initializing arrays, multi-dimensional arrays, String class, StringBuilder, StringBuffer", subjectId: subject._id },
        { order: 4, title: "OOP Part 1: Classes & Objects", seedTopic: "Classes, objects, constructors, 'this' keyword, static keyword, methods", subjectId: subject._id },
        { order: 5, title: "OOP Part 2: Inheritance", seedTopic: "IS-A relationship, types of inheritance, 'super' keyword, method overriding, final keyword", subjectId: subject._id },
        { order: 6, title: "OOP Part 3: Polymorphism", seedTopic: "Method overloading, method overriding, dynamic method dispatch, abstract classes, interfaces", subjectId: subject._id },
        { order: 7, title: "OOP Part 4: Encapsulation & Abstraction", seedTopic: "Access modifiers (public, private, protected, default), getter and setter methods, abstract classes vs interfaces", subjectId: subject._id },
        { order: 8, title: "Packages & Exception Handling", seedTopic: "Creating packages, importing packages, try-catch-finally blocks, checked vs unchecked exceptions, throw, throws", subjectId: subject._id },
        { order: 9, title: "Multithreading", seedTopic: "Thread lifecycle, creating threads (Thread class, Runnable interface), synchronization (synchronized methods/blocks)", subjectId: subject._id },
        { order: 10, title: "Collections Framework", seedTopic: "List (ArrayList, LinkedList), Set (HashSet, TreeSet), Map (HashMap, TreeMap), Iterator, Generics", subjectId: subject._id },
    ];
    const createdModules = await Module.insertMany(moduleData);
    subject.modules = createdModules.map(m => m._id);
    await subject.save();
    console.log("Java subject seeded successfully.");
}

async function seedPythonSubject() {
    const existing = await Subject.findOne({ key: "python" });
    if (existing) {
        console.log("Python subject already exists. Skipping.");
        return;
    }
    const subject = await Subject.create({ key: "python", title: "Python Programming", modules: [] });
    const moduleData = [
        { order: 1, title: "Python Basics", seedTopic: "Syntax, indentation, variables, basic data types (int, float, bool, string), operators", subjectId: subject._id },
        { order: 2, title: "Data Structures", seedTopic: "Lists, tuples, dictionaries, sets - creation, manipulation, and methods", subjectId: subject._id },
        { order: 3, title: "Control Flow", seedTopic: "Conditional statements (if/elif/else), loops (for, while), break, continue, pass", subjectId: subject._id },
        { order: 4, title: "Functions", seedTopic: "Defining functions, arguments (positional, keyword, default, *args, **kwargs), return values, scope (LEGB rule), lambda functions", subjectId: subject._id },
        { order: 5, title: "Modules & Packages", seedTopic: "Importing modules, creating modules, standard library overview, pip and package management", subjectId: subject._id },
        { order: 6, title: "File Handling", seedTopic: "Opening, reading, writing files, different modes, context managers (with statement)", subjectId: subject._id },
        { order: 7, title: "Object-Oriented Programming", seedTopic: "Classes, objects, inheritance, polymorphism, encapsulation, special methods (__init__, __str__)", subjectId: subject._id },
        { order: 8, title: "Exception Handling", seedTopic: "try, except, else, finally blocks, raising exceptions", subjectId: subject._id },
        { order: 9, title: "Regular Expressions", seedTopic: "Using the 're' module, pattern matching, search, findall, sub", subjectId: subject._id },
    ];
    const createdModules = await Module.insertMany(moduleData);
    subject.modules = createdModules.map(m => m._id);
    await subject.save();
    console.log("Python subject seeded successfully.");
}

async function seedCnSubject() {
    const existing = await Subject.findOne({ key: "cn" });
    if (existing) {
        console.log("Computer Networks subject already exists. Skipping.");
        return;
    }
    const subject = await Subject.create({ key: "cn", title: "Computer Networks", modules: [] });
    const moduleData = [
        { order: 1, title: "Introduction & Layering", seedTopic: "Network goals, applications, topologies, layered architecture (OSI, TCP/IP)", subjectId: subject._id },
        { order: 2, title: "Physical Layer", seedTopic: "Transmission media, encoding, multiplexing (FDM, TDM, WDM), switching (circuit, packet)", subjectId: subject._id },
        { order: 3, title: "Data Link Layer", seedTopic: "Framing, error detection (parity, CRC), error correction, flow control (Stop-and-Wait, Sliding Window), MAC protocols (ALOHA, CSMA/CD, CSMA/CA), Ethernet, ARP", subjectId: subject._id },
        { order: 4, title: "Network Layer - Addressing", seedTopic: "IPv4 addressing, subnetting, CIDR, IPv6 addressing", subjectId: subject._id },
        { order: 5, title: "Network Layer - Routing", seedTopic: "Routing algorithms (Distance Vector - RIP, Link State - OSPF), BGP, IP protocol, ICMP", subjectId: subject._id },
        { order: 6, title: "Transport Layer", seedTopic: "UDP, TCP (segment structure, connection establishment/termination - 3-way handshake, flow control, congestion control - AIMD, slow start)", subjectId: subject._id },
        { order: 7, title: "Application Layer", seedTopic: "Protocols: HTTP, HTTPS, FTP, SMTP, POP3, IMAP, DNS", subjectId: subject._id },
        { order: 8, title: "Network Security", seedTopic: "Cryptography basics (symmetric, asymmetric), firewalls, VPNs, common threats", subjectId: subject._id },
    ];
    const createdModules = await Module.insertMany(moduleData);
    subject.modules = createdModules.map(m => m._id);
    await subject.save();
    console.log("Computer Networks subject seeded successfully.");
}

async function seedDbmsSubject() {
    const existing = await Subject.findOne({ key: "dbms" });
    if (existing) {
        console.log("DBMS subject already exists. Skipping.");
        return;
    }
    const subject = await Subject.create({ key: "dbms", title: "Database Management Systems", modules: [] });
    const moduleData = [
        { order: 1, title: "Introduction & ER Model", seedTopic: "DBMS concepts, advantages, data models, ER diagrams (entities, attributes, relationships), constraints", subjectId: subject._id },
        { order: 2, title: "Relational Model", seedTopic: "Relational algebra (select, project, join, union, intersection, difference), tuple relational calculus, domain relational calculus", subjectId: subject._id },
        { order: 3, title: "SQL - Basic Queries", seedTopic: "DDL (CREATE, ALTER, DROP), DML (SELECT, INSERT, UPDATE, DELETE), basic SELECT queries (WHERE, ORDER BY, DISTINCT)", subjectId: subject._id },
        { order: 4, title: "SQL - Advanced Queries", seedTopic: "Aggregate functions (COUNT, SUM, AVG, MIN, MAX), GROUP BY, HAVING, Joins (INNER, LEFT, RIGHT, FULL), Subqueries, Views", subjectId: subject._id },
        { order: 5, title: "Database Design & Normalization", seedTopic: "Functional dependencies, Armstrong's axioms, Normal forms (1NF, 2NF, 3NF, BCNF), decomposition properties (lossless join, dependency preserving)", subjectId: subject._id },
        { order: 6, title: "File Organization & Indexing", seedTopic: "File organization methods (heap, sequential, indexed), Indexing structures (B-trees, B+ trees)", subjectId: subject._id },
        { order: 7, title: "Transaction Management", seedTopic: "ACID properties, transaction states, schedules (serializable, recoverable), concurrency control protocols (lock-based, timestamp-based)", subjectId: subject._id },
        { order: 8, title: "Recovery System", seedTopic: "Failure classification, log-based recovery, checkpointing, shadow paging", subjectId: subject._id },
    ];
    const createdModules = await Module.insertMany(moduleData);
    subject.modules = createdModules.map(m => m._id);
    await subject.save();
    console.log("DBMS subject seeded successfully.");
}

async function seedOsSubject() {
    const existing = await Subject.findOne({ key: "os" });
    if (existing) {
        console.log("Operating Systems subject already exists. Skipping.");
        return;
    }
    const subject = await Subject.create({ key: "os", title: "Operating Systems", modules: [] });
    const moduleData = [
        { order: 1, title: "Introduction to OS", seedTopic: "OS functions, structure, types (batch, time-sharing, real-time), system calls, kernel vs user mode", subjectId: subject._id },
        { order: 2, title: "Process Management", seedTopic: "Process concept, process states, PCB, process scheduling queues, context switching, inter-process communication (IPC)", subjectId: subject._id },
        { order: 3, title: "CPU Scheduling", seedTopic: "Scheduling criteria, algorithms (FCFS, SJF, SRTF, Priority, Round Robin, Multilevel Queue)", subjectId: subject._id },
        { order: 4, title: "Threads", seedTopic: "Thread concept, user vs kernel threads, multithreading models", subjectId: subject._id },
        { order: 5, title: "Process Synchronization", seedTopic: "Critical section problem, Peterson's solution, hardware support, semaphores, monitors, classic synchronization problems (Bounded Buffer, Readers-Writers)", subjectId: subject._id },
        { order: 6, title: "Deadlocks", seedTopic: "Deadlock conditions, handling methods (prevention, avoidance - Banker's algorithm, detection, recovery)", subjectId: subject._id },
        { order: 7, title: "Memory Management", seedTopic: "Logical vs physical address space, swapping, contiguous allocation, paging (segmentation vs paging), virtual memory, demand paging, page replacement algorithms (FIFO, Optimal, LRU)", subjectId: subject._id },
        { order: 8, title: "File Systems", seedTopic: "File concept, access methods, directory structure, allocation methods (contiguous, linked, indexed), free space management", subjectId: subject._id },
        { order: 9, title: "Disk Scheduling", seedTopic: "Disk structure, scheduling algorithms (FCFS, SSTF, SCAN, C-SCAN, LOOK, C-LOOK)", subjectId: subject._id },
    ];
    const createdModules = await Module.insertMany(moduleData);
    subject.modules = createdModules.map(m => m._id);
    await subject.save();
    console.log("Operating Systems subject seeded successfully.");
}


export { getSubjects, getSubjectById, seedSubjects };