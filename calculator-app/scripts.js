const display = document.getElementById("display");
const previous = document.getElementById("previous");
const buttons = document.querySelector(".buttons");

let expression = "";
let justCalculated = false;

function showDisplay(message) {
    display.textContent = message || expression || "0";
}

function appendValue(value) {
    if (justCalculated && /^[0-9.]$/.test(value)) {
        expression = "";
        previous.textContent = "";
    }

    justCalculated = false;
    if (!expression) previous.textContent = "";

    if (value === ".") {
        if (expression.endsWith("%")) return;
        const current = expression.split(/[+×÷%−]/).pop();
        if (current.includes(".")) return;
        if (!current) expression += "0";
    }

    if (value === "%" && !/[0-9.]$/.test(expression)) return;

    if (/^[+×÷−%]$/.test(value) && !expression) {
        if (value === "−") {
            expression = value;
            showDisplay();
        }
        return;
    }

    if (/^[+×÷−]$/.test(value) && /[+×÷−]$/.test(expression)) {
        if (value === "−" && /[+×÷]$/.test(expression)) {
            expression += value;
        } else {
            expression = expression.slice(0, -1) + value;
        }
        showDisplay();
        return;
    }

    expression += value;
    showDisplay();
}

function clearDisplay() {
    expression = "";
    previous.textContent = "";
    justCalculated = false;
    showDisplay();
}

function deleteLast() {
    expression = expression.slice(0, -1);
    previous.textContent = "";
    justCalculated = false;
    showDisplay();
}

function calculateExpression(input) {
    const text = input
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/−/g, "-")
        .replace(/\s+/g, "");
    let position = 0;

    function parseExpression() {
        let value = parseTerm();

        while (text[position] === "+" || text[position] === "-") {
            const operator = text[position++];
            const right = parseTerm();
            value = operator === "+" ? value + right : value - right;
        }

        return value;
    }

    function parseTerm() {
        let value = parseFactor();

        while (text[position] === "*" || text[position] === "/") {
            const operator = text[position++];
            const right = parseFactor();

            if (operator === "/" && right === 0) {
                throw new Error("Cannot divide by zero");
            }

            value = operator === "*" ? value * right : value / right;
        }

        return value;
    }

    function parseFactor() {
        if (text[position] === "-") {
            position++;
            return -parseFactor();
        }

        if (text[position] === "+") {
            position++;
            return parseFactor();
        }

        let value;

        if (text[position] === "(") {
            position++;
            value = parseExpression();

            if (text[position] !== ")") {
                throw new Error("Invalid calculation");
            }

            position++;
        } else {
            const start = position;

            while (/[0-9.]/.test(text[position] || "")) {
                position++;
            }

            const number = text.slice(start, position);
            if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(number)) {
                throw new Error("Invalid calculation");
            }

            value = Number(number);
        }

        if (text[position] === "%") {
            value /= 100;
            position++;
        }

        return value;
    }

    if (!text) {
        throw new Error("Invalid calculation");
    }

    const result = parseExpression();
    if (position !== text.length || !Number.isFinite(result)) {
        throw new Error("Invalid calculation");
    }

    return result;
}

function calculate() {
    try {
        const result = calculateExpression(expression);
        previous.textContent = expression + " =";
        expression = String(Number(result.toPrecision(12)));
        justCalculated = true;
        showDisplay();
    } catch (error) {
        previous.textContent = error.message === "Cannot divide by zero"
            ? error.message
            : "Invalid calculation";
        expression = "";
        justCalculated = false;
        showDisplay("Error");
    }
}

function handleInput(action, value) {
    if (action === "clear") {
        clearDisplay();
    } else if (action === "delete") {
        deleteLast();
    } else if (action === "calculate") {
        calculate();
    } else if (value) {
        appendValue(value);
    }
}

buttons.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;

    handleInput(button.dataset.action, button.dataset.value);
});

document.addEventListener("keydown", event => {
    const keyMap = {
        "*": "×",
        "/": "÷",
        "-": "−",
        Enter: "=",
        Backspace: "DEL",
        Escape: "AC"
    };
    const key = keyMap[event.key] || event.key;

    if (/^[0-9.+%]$/.test(key) || /^[×÷−]$/.test(key)) {
        event.preventDefault();
        appendValue(key);
    } else if (key === "=") {
        event.preventDefault();
        calculate();
    } else if (key === "DEL") {
        event.preventDefault();
        deleteLast();
    } else if (key === "AC") {
        clearDisplay();
    }
});

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./service-worker.js")
            .catch(error => console.error("Service worker registration failed:", error));
    });
}

showDisplay();
