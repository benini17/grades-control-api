import express from 'express';
import { promises as fs } from 'fs';

const { readFile, writeFile } = fs;

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    let grades = req.body;
    const data = JSON.parse(await readFile(global.fileName));
    let timestamp = new Date();

    grades = { id: data.nextId++, ...grades, timestamp };
    data.grades.push(grades);

    await writeFile(global.fileName, JSON.stringify(data, null, 2));

    //TODO: data.grades.find() to select the one who's been registered
    /* data.grades.find(
      (grade) => grade.id === parseInt(req.params.id)
    ); */
    res.send(grades);

    global.logger.info(`POST /account - ${JSON.stringify(data)}`);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const data = JSON.parse(await readFile(global.fileName));
    delete data.nextId;

    res.send(data);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const data = JSON.parse(await readFile(global.fileName));
    const userGrade = data.grades.find(
      (grade) => grade.id === parseInt(req.params.id)
    );
    res.send(userGrade);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const data = JSON.parse(await readFile(global.fileName));
    let information = data.grades.find(
      (grade) => grade.id === parseInt(req.params.id)
    );
    console.log('information', information);

    res.send(`${information.id} - ${information.student} Removed! <br>
    <del>${information.subject}</del> <br>
    <del>${information.type}</del> <br>
    <del>${information.value}</del> <br>
    `);

    data.grades = data.grades.filter(
      (grade) => grade.id !== parseInt(req.params.id)
    );

    await writeFile(global.fileName, JSON.stringify(data, null, 2));
  } catch (err) {
    next(err);
  }
});

router.put('/', async (req, res, next) => {
  try {
    const userGrade = req.body;

    const data = JSON.parse(await readFile(global.fileName));

    let index = data.grades.findIndex(
      (grade) => grade.id === parseInt(userGrade.id)
    );

    if (index === -1) {
      throw new Error('Registro não encontrado.');
    }

    data.grades[index] = userGrade;

    await writeFile(global.fileName, JSON.stringify(data, null, 2));

    res.send(userGrade);
  } catch (err) {
    next(err);
  }
});

//FIXME: userGrade keeps resulting undefined
router.get('/:student/:subject', async (req, res, next) => {
  try {
    const data = JSON.parse(await readFile(global.fileName));
    const paramBody = req.params;

    let userGrade = data.grades.filter((grade) => {
      grade.student.replace(/ /g, '-') === paramBody.student &&
        grade.subject === paramBody.subject;
    });

    let total = userGrade.reduce((acc, crr) => {
      acc + crr.value;
    }, 0);

    res.send(`${userGrade.student} ${userGrade.subject} ${total}`);
  } catch (err) {
    next(err);
  }
});

router.get('/:subject/:type', async (req, res, next) => {
  try {
    const bodyParams = req.query;
    const data = JSON.parse(await readFile(global.fileName));
    let totalRegistered = 0;
    let avarageValue = 0;

    const userGrade = data.grades.filter((grade) => {
      grade.subject.replace(/ /g, '') == bodyParams.subject &&
        grade.type.replace(/ /g, '-') == bodyParams.type;
    });

    userGrade.forEach((sumValues) => {
      type = sumValues.type;
      subject = sumValues.subject;
      totalRegistered++;
      totValues += sumValues.value;
    });

    res.send(
      ` Média das notas da matéria ${subject} atividade ${type} é ${
        totValues / totalRegistered
      }`
    );
  } catch (err) {
    next(err);
  }
});

router.use((err, req, res, next) => {
  global.logger.error(`${req.method} ${req.baseUrl} - ${err.message}`);
  res.status(400).send({ error: err.message });
});
export default router;
