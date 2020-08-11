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

router.get('/:student/:subject', async (req, res, next) => {
  try {
    console.log('entrou aqui student subject');
    const data = JSON.parse(await readFile(global.fileName));
    const paramBody = req.params;

    let userGrade = data.grades.filter((grade) => {
      return (
        grade.student.replace(/ /g, '-') === paramBody.student &&
        grade.subject.replace(/ /g, '') === paramBody.subject
      );
    });
    console.log('userGrade', userGrade);

    let total = userGrade.reduce((acc, crr) => {
      return acc + crr.value;
    }, 0);

    console.log('total', total);

    res.send(`${userGrade[0].student}  ${userGrade[0].subject}  ${total}`);
  } catch (err) {
    next(err);
  }
});

router.get('/average/:subject/:type', async (req, res, next) => {
  try {
    console.log('entrou aqui subject type');
    const bodyParams = req.params;
    const data = JSON.parse(await readFile(global.fileName));
    let totalRegistered = 0;
    let type;
    let subject;
    let totValues = 0;
    let averageValue = 0;

    const userGrade = data.grades.filter((grade) => {
      console.log('bodyParams.subject', bodyParams.subject);
      console.log(
        "grade.subject.replace(/ /g, '')",
        grade.subject.replace(/ /g, '')
      );
      return (
        grade.subject.replace(/ /g, '') === bodyParams.subject &&
        grade.type.replace(/ /g, '-') === bodyParams.type
      );
    });
    console.log('userGrade filter', userGrade);

    userGrade.forEach((sumValues) => {
      type = sumValues.type;
      subject = sumValues.subject;
      totalRegistered++;
      totValues += sumValues.value;
    });
    console.log('userGrade foreach', userGrade);

    averageValue = totValues / totalRegistered;
    console.log('averageValue', averageValue);
    res.send(
      ` Média das notas da matéria ${subject} atividade ${type} é ${averageValue}`
    );
  } catch (err) {
    next(err);
  }
});

router.get('/top3/:subject/:type', async (req, res, next) => {
  try {
    console.log('entrou aqui top 3 student subject');
    const data = JSON.parse(await readFile(global.fileName));
    const paramBody = req.params;

    let userGrade = data.grades.filter((grade) => {
      return (
        grade.subject.replace(/ /g, '') === paramBody.subject &&
        grade.type.replace(/ /g, '-') === paramBody.type
      );
    });

    userGrade
      .sort(function (a, b) {
        return a - b;
      })
      .slice(0, 2);

    console.log('userGrade', userGrade);

    res.send(`${userGrade[0].student}  ${userGrade[0].subject}  ${userGrade[0].value} <br>
    ${userGrade[1].student}  ${userGrade[1].subject}  ${userGrade[1].value} <br>
    ${userGrade[2].student}  ${userGrade[2].subject}  ${userGrade[2].value}`);
  } catch (err) {
    next(err);
  }
});

router.use((err, req, res, next) => {
  global.logger.error(`${req.method} ${req.baseUrl} - ${err.message}`);
  res.status(400).send({ error: err.message });
});
export default router;
