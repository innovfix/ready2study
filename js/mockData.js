// Mock Data representing parsed PDF content
// This will be replaced by the actual content from the user's PDF later.

const mockQuestions = [
    {
        id: 1,
        marks: 1,
        examDate: "May 2023",
        question: "What is the primary function of the mitochondria?",
        image: "https://placehold.co/600x400/png?text=Mitochondria+Diagram",
        answer: "The mitochondria is known as the powerhouse of the cell, responsible for generating most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy."
    },
    {
        id: 2,
        marks: 1,
        examDate: "Nov 2022",
        question: "Define 'Osmosis'.",
        answer: "Osmosis is the movement of water molecules from a solution with a high concentration of water molecules to a solution with a lower concentration of water molecules, through a cell's partially permeable membrane."
    },
    {
        id: 3,
        marks: 2,
        examDate: "May 2022",
        question: "Differentiate between Prokaryotic and Eukaryotic cells.",
        answer: "Prokaryotic cells lack a nucleus and other membrane-bound organelles and are generally smaller (e.g., bacteria). Eukaryotic cells have a nucleus enclosed within membranes and contain other membrane-bound organelles (e.g., plant and animal cells)."
    },
    {
        id: 4,
        marks: 2,
        examDate: "Nov 2021",
        question: "22 Chapter 2 Basic Science Concepts The following material is provided as basic background information necessary to understand the components and processes associated with drinking water systems",
        answer: "22 Chapter 2 Basic Science Concepts The following material is provided as basic background information necessary to understand the components and processes associated with drinking water systems"
    },
    {
        id: 5,
        marks: 3,
        examDate: "May 2023",
        question: "Describe the process of Photosynthesis.",
        image: "https://placehold.co/600x400/png?text=Photosynthesis+Process",
        answer: "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods with the help of chlorophyll pigments. \n1. Absorption of light energy by chlorophyll.\n2. Conversion of light energy to chemical energy and splitting of water molecules into hydrogen and oxygen.\n3. Reduction of carbon dioxide to carbohydrates."
    },
    {
        id: 6,
        marks: 3,
        examDate: "Nov 2020",
        question: "What are the three laws of motion proposed by Newton?",
        answer: "1. First Law (Inertia): An object will not change its motion unless a force acts on it.\n2. Second Law (F=ma): The force on an object is equal to its mass times its acceleration.\n3. Third Law: When two objects interact, they apply forces to each other of equal magnitude and opposite direction."
    },
    {
        id: 7,
        marks: 10,
        examDate: "May 2021",
        question: "Discuss the causes and consequences of the Industrial Revolution.",
        answer: "The Industrial Revolution was a period of major industrialization that took place during the late 1700s and early 1800s.\n\n**Causes:**\n- Agricultural Revolution: Increased food production led to population growth.\n- Availability of Natural Resources: Coal and iron ore were abundant.\n- Technological Innovations: Steam engine, spinning jenny.\n- Political Stability: Encouraged business and investment.\n\n**Consequences:**\n- Urbanization: Mass movement of people to cities.\n- Economic Growth: Rise of factory system and mass production.\n- Social Class Changes: Emergence of the working class and the bourgeoisie.\n- Environmental Impact: Pollution and poor living conditions in cities."
    },
    {
        id: 8,
        marks: 10,
        examDate: "Nov 2019",
        question: "Explain the Software Development Life Cycle (SDLC) models.",
        image: "https://placehold.co/600x400/png?text=SDLC+Models+Chart",
        answer: "The SDLC is a process used by the software industry to design, develop and test high quality software.\n\n**Common Models:**\n1. **Waterfall Model**: A linear sequential flow. simple to understand but rigid.\n2. **Agile Model**: Iterative approach, focuses on flexibility and customer satisfaction.\n3. **Spiral Model**: Combines iterative development with systematic aspects of the waterfall model, emphasis on risk analysis.\n4. **V-Model**: Extension of waterfall, where process steps are bent upwards after the coding phase, to form the typical V shape. Demonstrates relationships between each phase of the development life cycle and its associated phase of testing."
    }
];
