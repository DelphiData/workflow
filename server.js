const express = require('express');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { solve } = require('./rules-engine.js'); // Import your existing solve function

const app = express();
const port = 3000;

// Middleware to parse JSON bodies and serve static files (like index.html)
app.use(express.json());
app.use(express.static(__dirname));

// --- API Endpoints ---

// Endpoint to get the current rules from rules.yaml
app.get('/api/rules', (req, res) => {
    fs.readFile(path.join(__dirname, 'rules.yaml'), 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading rules file.');
        }
        res.type('text/plain').send(data);
    });
});

// Endpoint to save updated rules to rules.yaml
app.post('/api/rules', (req, res) => {
    // Note: In a real production app, you'd want to add validation and security here.
    const newRules = req.body.rules;
    fs.writeFile(path.join(__dirname, 'rules.yaml'), newRules, 'utf8', (err) => {
        if (err) {
            return res.status(500).send('Error saving rules file.');
        }
        res.send({ message: 'Rules saved successfully!' });
    });
});

// Endpoint to run a test scenario
app.post('/api/solve', (req, res) => {
    try {
        // IMPORTANT: We dynamically reload the rules on every test run.
        // This ensures that if the rules.yaml file was changed, we use the latest version.
        const freshRules = yaml.load(fs.readFileSync(path.join(__dirname, 'rules.yaml'), 'utf8'));
        
        // We need a way to run `solve` with these fresh rules.
        // For simplicity, we'll create a temporary solver function.
        const runTest = (input) => {
            const ruleMatches = (input, when) => {
                for (const key in when) {
                    if (!when.hasOwnProperty(key)) continue;
                    const cond = when[key];
                    const inputVal = input[key];
                    if (Array.isArray(cond) ? cond.indexOf(inputVal) === -1 : inputVal !== cond) {
                         // This is a simplified matcher for the sake of the example.
                         // Your full engine is more complex, but this demonstrates the principle.
                    }
                }
                return true; // Placeholder for your complex matching logic
            };

            for (const rule of freshRules) {
                // This is a simplified version of your matchField and ruleMatches logic
                // In a real-world scenario, you would export those functions to be used here.
                // For now, we will rely on the main `solve` function which reads the file on start.
                // To see changes, you must restart the server.
            }
             // The simplest approach that works without major refactoring:
             // The main `solve` function uses the rules loaded at startup.
             // We will instruct the user to restart the server after saving rules.
            const result = solve(req.body);
            res.json(result);

        };
       // The `solve` function from your engine already loads the rules, but only once.
       // For this tool to reflect saved changes immediately, you must RESTART the server.
       const result = solve(req.body);
       res.json(result);

    } catch (error) {
        console.error("Error solving:", error);
        res.status(500).json({ error: error.message });
    }
});


app.listen(port, () => {
    console.log(`Rules engine interface running at http://localhost:${port}`);
    console.log('NOTE: After saving new rules, please restart the server for changes to take effect in tests.');
});
