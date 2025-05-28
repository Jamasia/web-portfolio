// Default configurations
const DEFAULTS = {
    history: Array(8).fill(['', '', '']),
    memory: [
        ['@1:', ''], ['@2:', ''], ['@3:', ''], ['@4:', ''], ['@5:', ''],
        ['@6:', ''], ['@7:', ''], ['@8:', ''], ['@9:', ''], ['@@:', '']
    ],
    cpu: [
        ['?1', '?2', '?3'], ['', '', '']
    ],
    tempMem: ['', '', ''],
    ctrlMode: "reset",
    entCount: 0,
    datCount: 0,
    memVal: Array(10).fill(false),
    regVal: Array(3).fill(false)
};

let history = structuredClone(DEFAULTS.history);
let memory = structuredClone(DEFAULTS.memory);
let cpu = structuredClone(DEFAULTS.cpu);
let tempMem = [...DEFAULTS.tempMem];

let ctrlMode = DEFAULTS.ctrlMode;
let entCount = DEFAULTS.entCount;
let datCount = DEFAULTS.datCount;

let memVal = DEFAULTS.memVal;
let regVal = DEFAULTS.regVal;

const ctrl = ["LOAD", "STORE", "WRITE", "ADD", "SUB", ''];
const ctrlBtn = ["load", "store", "memory", "+", "-", "reset"];
const numPad = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
const address = numPad.concat('@');
const regNum = ["1","2", "3"];
const delEnt = ["delete", "enter"];

const buttons = document.querySelectorAll('button');

initDefault();

function initDefault() {
    resetDefaults();
    updateTables();
    setupButtonListeners();
    enableOnly(['memory']);
}

function resetDefaults() {
    history = structuredClone(DEFAULTS.history);
    memory = structuredClone(DEFAULTS.memory);
    cpu = structuredClone(DEFAULTS.cpu);
    
    tempMem = [...DEFAULTS.tempMem];
    ctrlMode = DEFAULTS.ctrlMode;
    
    entCount = DEFAULTS.entCount;
    datCount = DEFAULTS.datCount;
    
    memVal = DEFAULTS.memVal;
    regVal = DEFAULTS.regVal;
}

function updateTables() {
    updateTable(history, ".history_table tbody");
    updateTable(memory, ".memory_table tbody");
    updateTable(cpu, ".cpu_table tbody");
}

function updateTable(data, selector) {
    const tableBody = document.querySelector(selector);
    if (!tableBody) return;
    tableBody.innerHTML = data.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('');
}

function enableOnly(idsArray) {
    buttons.forEach(button => button.disabled = true);
    idsArray.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.disabled = false;
    });
}

function setupButtonListeners() {
    document.addEventListener("click", handleButtonClick);
}

function handleButtonClick(event) {
    if (event.target.tagName !== "BUTTON") return;
    const buttonId = event.target.id;

    if (ctrlBtn.includes(buttonId)) {
        ctrlMode = buttonId;
        tempMem[0] = ctrl[ctrlBtn.indexOf(ctrlMode)];
        event.target.disabled = true;
        console.log(ctrlMode, tempMem);
        history[0] = tempMem;
        updateTable(history, ".history_table tbody");
    }

    switch (ctrlMode) {
        case "memory":
            memoryFunc();
            break;
        case "reset":
            initDefault();
            break;
		case "load":
			loadFunc();
			break;
		case "store":
			storeFunc();
			break;
    }
}

function memoryFunc() {
    enableOnly([...address, "reset"]);

    document.addEventListener("click", event => {
        if (event.target.tagName !== "BUTTON") return;
        const buttonId = event.target.id;
        enableOnly([...delEnt, "reset"]);

        switch (buttonId) {
            case "delete":
                if (! entCount) {
                    tempMem[1] = '';
                    memoryFunc();
                }
                break;
            case "reset":
                initDefault();
                break;
            case "enter":
                if (entCount === 0 && datCount === 0) {
                    dataInput();
                }
                entCount++;
                break;
            default:
                if ([...numPad, "@"].includes(buttonId) && !entCount) {
                    tempMem[1] = "@" + buttonId;
                }
				
                break;
        }
        console.log(tempMem, entCount);
        history[0] = tempMem;
        updateTable(history, ".history_table tbody");
    }, { once: true });
}

function dataInput() {
    if (datCount === 0) {
        enableOnly([...numPad, "0", "reset"]);
    } else if (datCount < 2) {
        enableOnly([...numPad, "0", ...delEnt, "reset"]);
    } else {
        enableOnly([...delEnt, "reset"]);
    }

    document.addEventListener("click", event => {
        if (event.target.tagName !== "BUTTON") return;
        const buttonId = event.target.id;
        enableOnly([...delEnt, "reset"]);

        if (buttonId === "delete" && entCount === 1) {
            tempMem[2] = tempMem[2].slice(0, -1);
            datCount--;
            dataInput();
        } else if (buttonId === "enter" && entCount === 2) {
            const matchIndex = memory.findIndex(row => row[0] === `${tempMem[1]}:`);
            memory[matchIndex][1] = tempMem[2];
            updateTable(memory, ".memory_table tbody");
            
            for (let i = 6; i >= 0; i--) {
                history[i + 1] = history[i];
            }
            tempMem = [...DEFAULTS.tempMem];
            ctrlMode = DEFAULTS.ctrlMode;
            entCount = DEFAULTS.entCount;
            datCount = DEFAULTS.datCount;
            instructionIn();
			
        } else if ([...numPad, "0"].includes(buttonId) && entCount === 1 && datCount < 2) {
            tempMem[2] += buttonId;
            datCount = tempMem[2].length;
            dataInput();
        }

        console.log(tempMem, entCount, datCount);
        history[0] = tempMem;
        updateTables();
    }, { once: true });
}

function memoryCheck() {
    for (let i = 0; i < 10; i++) {
        memVal[i] = memory[i][1] !== '';
    }
}

function registerCheck() {
    for (let i = 0; i < 3; i++) {
        regVal[i] = cpu[1][i] !== '';
    }
}

function insBtnHandler() {
    let instructionBtn = ['reset', 'memory'];
    
    memoryCheck();
    registerCheck();
    
    if (memVal.filter(Boolean).length >= 1) {
        console.log("memory:", memVal);
        instructionBtn = instructionBtn.concat(['load']);
    }
    if (regVal.filter(Boolean).length > 0) {
        console.log(regVal);
        instructionBtn = instructionBtn.concat(['store']);
    }
    if (regVal[0] && regVal[1]) {
        instructionBtn = instructionBtn.concat(['+', '-']);
    }
    
    enableOnly(instructionBtn);
}

function instructionIn() {
    insBtnHandler();
    
    document.addEventListener("click", event => {
        if (event.target.tagName !== "BUTTON") return;
        const buttonId = event.target.id;
        enableOnly([...delEnt, "reset"]);

        switch (buttonId) {
            case "memory":
                memoryFunc();
                break;
            case "reset":
                initDefault();
                break;
            case "load":
                loadFunc();
                break;
            case "store":
                storeFunc();
                break;
            case "+":
                add();
                break;
            case "-":
                sub();
                break;
        }
        memoryCheck();
        registerCheck();
    }, { once: true });
}

function loadFunc() {
    let storeBtn = ['reset'];
    
    memoryCheck();
    registerCheck();

    for (let i = 0; i < 10; i++) {
        if (memVal[i]) {
            storeBtn = storeBtn.concat(address[i]);
            console.log(i);
        }
    }
	
    enableOnly(storeBtn);
    
	document.addEventListener("click", event => {
        if (event.target.tagName !== "BUTTON") return;
        const buttonId = event.target.id;
        enableOnly([...delEnt, "reset"]);
		console.log("testLoad: ", buttonId);
		
        switch (buttonId) {
            case "delete":
                if (entCount == 0) {
                    tempMem[2] = '';
                    loadFunc();
                }else{
					regInput();
					tempMem[1] = '';
				}
                break;
            case "reset":
                initDefault();
                break;
            case "enter":
                if (entCount === 0 && datCount === 0) {
                    regInput();
                }
                entCount++;
                break;
            default:
                if ([...numPad, "@"].includes(buttonId) && !entCount) {
                    tempMem[2] = "@" + buttonId;
                }
                break;
        }
        console.log(tempMem, entCount);
        history[0] = tempMem;
        updateTable(history, ".history_table tbody");
		
		memoryCheck();
        registerCheck();
    }, { once: true });
	
}

function regInput() {
    enableOnly(regNum.concat("reset"));
    
    document.addEventListener("click", event => {
        if (event.target.tagName !== "BUTTON") return;
        const buttonId = event.target.id;
        
        if (regNum.includes(buttonId)) {
            tempMem[1] = "?".concat(buttonId);
            
            for (let i = 6; i >= 0; i--) {
                history[i + 1] = history[i];
            }
        }
        
        if (tempMem[2] == '@@') {
            cpu[1][(buttonId - 1)] = memory[9][1];
            memory[9][1] = '';
        } else {
            cpu[1][(buttonId - 1)] = memory[parseInt(tempMem[2].slice(1)) - 1][1];
            console.log(parseInt(tempMem[2].slice(1)));
            memory[parseInt(tempMem[2].slice(1)) - 1][1] = '';
        }
        
        history[0] = DEFAULTS.tempMem;
        
        updateTables();
        instructionIn();
        
        restoreDefaults();
    }, { once: true });
	
}

function storeFunc() {
    let storeBtn = ['reset'];
    
    memoryCheck();
    registerCheck();
    
    for (let i = 0; i < 10; i++) {
        if (regVal[i]) {
            storeBtn = storeBtn.concat(String(i + 1));
        }
    }
    enableOnly(storeBtn);
	
	document.addEventListener("click", event => {
        if (event.target.tagName !== "BUTTON") return;
        const buttonId = event.target.id;
        enableOnly([...delEnt, "reset"]);
		console.log("testStore: ", buttonId);
		
        switch (buttonId) {
            case "delete":
                if (! entCount) {
                    tempMem[2] = '';
                    storeFunc();
                }
                break;
            case "reset":
                initDefault();
                break;
            case "enter":
                if (entCount === 0 && datCount === 0) {
                    storeMem();
                }
                entCount++;
                break;
            default:
                if (regNum.includes(buttonId) && !entCount) {
                    tempMem[2] = "?" + buttonId;
                }
                break;
        }
        console.log(tempMem, entCount);
        history[0] = tempMem;
        updateTable(history, ".history_table tbody");
		
    }, { once: true });
	
}

function storeMem() {
    enableOnly(numPad.concat(["reset", "@"]));
    
    document.addEventListener("click", event => {
        if (event.target.tagName !== "BUTTON") return;
        const buttonId = event.target.id;
        
        if ("@".concat(numPad).includes(buttonId)) {
            tempMem[1] = "@".concat(buttonId);
            
            for (let i = 6; i >= 0; i--) {
                history[i + 1] = history[i];
            }
        }
        
        if (buttonId == '@') {
            memory[9][1] = cpu[1][parseInt(tempMem[2].slice(1)) - 1];
        } else {
            memory[(buttonId - 1)][1] = cpu[1][parseInt(tempMem[2].slice(1)) - 1];
            console.log(parseInt(tempMem[2].slice(1)));
        }
        
        history[0] = DEFAULTS.tempMem;
        
        updateTables();
        instructionIn();
        
        restoreDefaults();
    }, { once: true });
}

function add() {
    tempMem[1] = cpu[1][0];
    tempMem[2] = cpu[1][1];
    
    cpu[1][2] = parseInt(cpu[1][0]) + parseInt(cpu[1][1]);
    
    for (let i = 6; i >= 0; i--) {
        history[i + 1] = history[i];
    }
    
    history[0] = DEFAULTS.tempMem;
    history[1] = tempMem;
    updateTables();
    instructionIn();

    restoreDefaults();
}

function sub() {
    tempMem[1] = cpu[1][0];
    tempMem[2] = cpu[1][1];
    
    cpu[1][2] = parseInt(cpu[1][1]) - parseInt(cpu[1][0]);
    
    for (let i = 6; i >= 0; i--) {
        history[i + 1] = history[i];
    }
    
    history[0] = DEFAULTS.tempMem;
    history[1] = tempMem;
    updateTables();
    instructionIn();
    
    restoreDefaults();
}

function restoreDefaults() {
    tempMem = [...DEFAULTS.tempMem];
    ctrlMode = DEFAULTS.ctrlMode;
    entCount = DEFAULTS.entCount;
 datCount = DEFAULTS.datCount;
    memoryCheck();
    registerCheck();
}