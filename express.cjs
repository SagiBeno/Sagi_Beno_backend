const express = require('express');
const mysql = require('mysql2');
const app = express();

app.use(express.json());

const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ingatlan'
});

app.get('/api/ingatlan', (req, res) => {
    conn.query(`
        SELECT ingatlanok.id, kategoriak.nev AS 'kategoria', ingatlanok.leiras, ingatlanok.hirdetesDatuma, ingatlanok.tehermentes, ingatlanok.ar, ingatlanok.kepUrl
        FROM ingatlanok
        INNER JOIN kategoriak
        ON kategoriak.id = ingatlanok.id`
    , (err, result, fields) => {
        if (err) res.status(404).json({error: err});
        if (result) {
            res.status(200).json(result);
        } else {
            res.status(403).json({error: err})
        }
    });
});

app.post('/api/ingatlan', (req, res) => {
    const kategoriaId = req.body?.kategoria;
    let date = req.body?.hirdetesDatuma;
    const freeOfCharge = req.body?.tehermentes;
    const price = req.body?.ar;

    const description = req.body?.leiras;
    const imageUrl = req.body?.kepUrl;

    let queryStr = "INSERT INTO ingatlanok";
    var values = [];

    if (date == undefined) {
        const currentDate = new Date()
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const day = currentDate.getDay();
        
        const newDate = year.toString() + "-" + month.toString() + "-" + day.toString();
        date = newDate;
    }
    
    if (kategoriaId == undefined || freeOfCharge == undefined|| price == undefined) {
        res.status(400).send('Hiányzó adatok.');
    } 

    queryStr += ' (kategoria, hirdetesDatuma, tehermentes, ar';
    values.push(kategoriaId, date, freeOfCharge, price);

    if (description != undefined) {
        queryStr += ", leiras";
        values.push(description);
    }
    if (imageUrl != undefined) {
        queryStr += ', kepUrl';
        values.push(imageUrl);
    }
    
    let questionMarks = "(";
    for (let i = 0; i < values.length - 1; i++) {
        questionMarks += "?,"
    }
    questionMarks += "?) ";
    queryStr += ') VALUES ' + questionMarks;

    conn.query(queryStr, [...values],
        (err, result, fields) => {
            if (err) res.sendStatus(400);
            if (result) {
                const id = result.insertId;
                res.status(201).json({Id: id});
            }
        }
    );
});

app.delete('/api/ingatlan/:id', (req, res) => {
    const id = req.params?.id;

    conn.query(`
            DELETE FROM ingatlanok
            WHERE id = ?    
        `,
        [id],
        (err, result, fields) => {
            if (err) res.status(400).json('Connection error');
            if (result) {
                const modifiedRow = result.affectedRows;
                if (modifiedRow != 0) res.sendStatus(204);
                else res.sendStatus(404);
            }
        }
    );
});

const port = 3333;
app.listen(port, () => {
    console.log('Express backend server is running on port', port);
});