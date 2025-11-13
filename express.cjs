const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ingatlan'
});

conn.connect(err => {
    if (err) console.warn
    else console.log('Succesfully connected to database ingatlan.')
})

app.get('/api/ingatlan', (req, res) => {
    conn.query(`
        SELECT ingatlanok.id, kategoriak.nev AS 'kategoria', ingatlanok.leiras, ingatlanok.hirdetesDatuma, ingatlanok.tehermentes, ingatlanok.ar, ingatlanok.kepUrl
        FROM ingatlanok
        INNER JOIN kategoriak
        ON kategoriak.id = ingatlanok.kategoria`
    , (err, result, fields) => {
        if (err) res.status(500).json({error: err});
        if (result) {

            const refactoredResults = result.map(row => ({
                ...row, tehermentes: !!row.tehermentes,
                hirdetesDatuma: row.hirdetesDatuma.toISOString().slice(0, 10)
             }));
            res.status(200).json(refactoredResults);
        } else {
            res.status(403).json({error: err})
        }
    });
});

app.post('/api/ingatlan', (req, res) => {
    const _id = req.body?._id
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
        const month = currentDate.getMonth() + 1;
        const day = currentDate.getDate();
        
        const newDate = year.toString() + "-" + month.toString() + "-" + day.toString();
        date = newDate;
    }
    
    if (kategoriaId == undefined || freeOfCharge == undefined|| price == undefined) {
        res.status(400).send('Hiányzó adatok.');
    } else {
        if (_id == undefined) {
            queryStr += ' (kategoria, hirdetesDatuma, tehermentes, ar';
            values.push(kategoriaId, date, freeOfCharge, price);
        } else {
            queryStr += ' (id, kategoria, hirdetesDatuma, tehermentes, ar';
            values.push(_id, kategoriaId, date, freeOfCharge, price);
        }
    }

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
            if (err) res.status(500).json({err: err});
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
            if (err) res.status(500).json('Connection error');
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