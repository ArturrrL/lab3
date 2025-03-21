const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(__dirname)); // Статичні файли з кореневої папки

app.post('/save-result', async (req, res) => {
    const newResult = req.body;
    let results = [];

    try {
        const data = await fs.readFile('results.json', 'utf8');
        results = JSON.parse(data);
    } catch (err) {
        results = [];
    }

    results.push(newResult);
    await fs.writeFile('results.json', JSON.stringify(results, null, 2));

    // Знаходження рекорду для користувача
    const userResults = results.filter(r => r.username === newResult.username);
    const bestScore = Math.max(...userResults.map(r => r.score));

    res.json({ bestScore });
});

app.listen(port, () => {
    console.log(`Сервер запущено на http://localhost:${port}`);
});