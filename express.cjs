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

const port = 3333;
app.listen(port, () => {
    console.log('Express backend server is running on port', port);
});