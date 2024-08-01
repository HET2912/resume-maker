const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect('mongodb://localhost:27017/resumeDB', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

const fs = require('fs');
const dir = './uploads';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

const resumeSchema = new mongoose.Schema({
    name: String,
    email: String,
    phoneNumber: String,
    github: String,
    city: String,
    summary: String,
    registrations: [{
        professionalExperiences: [{
            title: String,
            company: String,
            startDate: Date,
            endDate: Date,
            description: String
        }],
        educations: [{
            institution: String,
            degree: String,
            startDate: Date,
            endDate: Date,
            description: String
        }],
        keyAchievements: [{
            title: String,
            description: String,
            date: Date
        }],
        skills: [String],
        resume: String,
        timestamp: { type: Date, default: Date.now }
    }]
});

const Resume = mongoose.model('Resume', resumeSchema);

app.post('/register', upload.single('resume'), (req, res) => {
    const {
        name,
        email,
        phoneNumber,
        github,
        city,
        summary,
        professionalExperiences,
        educations,
        keyAchievements,
        skills
    } = req.body;

    const newRegistration = {
        professionalExperiences: JSON.parse(professionalExperiences),
        educations: JSON.parse(educations),
        keyAchievements: JSON.parse(keyAchievements),
        skills: JSON.parse(skills),
        resume: req.file.path,
        timestamp: new Date()
    };

    Resume.findOneAndUpdate(
        { email: email },
        {
            $set: { name: name, phoneNumber: phoneNumber, github: github, city: city, summary: summary },
            $push: { registrations: newRegistration }
        },
        { upsert: true, new: true, useFindAndModify: false }
    )
        .then(() => res.send('Registration successful'))
        .catch(err => res.status(400).send('Error: ' + err));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
