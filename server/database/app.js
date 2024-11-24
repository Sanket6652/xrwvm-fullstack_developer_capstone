const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const cors = require('cors')
const app = express()
const port = 3030;

app.use(cors())
app.use(require('body-parser').urlencoded({ extended: false }));

const reviews_data = JSON.parse(fs.readFileSync("reviews.json", 'utf8'));
const dealerships_data = JSON.parse(fs.readFileSync("dealerships.json", 'utf8'));

mongoose.connect("mongodb://mongo_db:27017/", { 'dbName': 'dealershipsDB' });


const Reviews = require('./review');

const Dealerships = require('./dealership');

try {
    Reviews.deleteMany({}).then(() => {
        Reviews.insertMany(reviews_data['reviews']);
    });
    Dealerships.deleteMany({}).then(() => {
        Dealerships.insertMany(dealerships_data['dealerships']);
    });

} catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
}


// Express route to home
app.get('/', async (req, res) => {
    res.send("Welcome to the Mongoose API")
});

// Express route to fetch all reviews
app.get('/fetchReviews', async (req, res) => {
    try {
        const documents = await Reviews.find();
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching documents' });
    }
});

// Express route to fetch reviews by a particular dealer
app.get('/fetchReviews/dealer/:id', async (req, res) => {
    try {
        const documents = await Reviews.find({ dealership: req.params.id });
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching documents' });
    }
});

// Express route to fetch all dealerships
app.get('/fetchDealers', async (req, res) => {
    //Write your code here
    try {
        // Fetch all dealerships from the database
        const dealers = await Dealerships.find({});

        // If no dealerships found, return appropriate message
        if (!dealers || dealers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No dealerships found'
            });
        }

        // Return success response with dealerships data
        return res.status(200).json({
            success: true,
            data: dealers,
            count: dealers.length
        });

    } catch (error) {
        // Handle any errors that occur during the process
        return res.status(500).json({
            success: false,
            message: 'Error fetching dealerships',
            error: error.message
        });
    }
});

// Express route to fetch Dealers by a particular state
app.get('/fetchDealers/:state', async (req, res) => {
    //Write your code here
    try {
        // Get state from URL parameters
        const { state } = req.params;

        // Find all dealers in the specified state
        const dealers = await Dealerships.find({
            state: {
                // Using regex for case-insensitive search
                $regex: new RegExp(state, 'i')
            }
        });

        // If no dealers found in that state
        if (!dealers || dealers.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No dealerships found in ${state}`
            });
        }

        // Return success response with dealers data
        return res.status(200).json({
            success: true,
            data: dealers,
            count: dealers.length
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching dealerships',
            error: error.message
        });
    }
});

// Express route to fetch dealer by a particular id
app.get('/fetchDealer/:id', async (req, res) => {
    //Write your code here
    try {
        // Get id from URL parameters
        const { id } = req.params;

        // Find dealer with the specified ID
        const dealer = await Dealerships.findOne({
            id: parseInt(id) // Convert string to number since ID is stored as Number
        });

        // If no dealer found with that ID
        if (!dealer) {
            return res.status(404).json({
                success: false,
                message: `No dealership found with ID ${id}`
            });
        }

        // Return success response with dealer data
        return res.status(200).json({
            success: true,
            data: dealer
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching dealership',
            error: error.message
        });
    }
});

//Express route to insert review
app.post('/insert_review', express.raw({ type: '*/*' }), async (req, res) => {
    data = JSON.parse(req.body);
    const documents = await Reviews.find().sort({ id: -1 })
    let new_id = documents[0]['id'] + 1

    const review = new Reviews({
        "id": new_id,
        "name": data['name'],
        "dealership": data['dealership'],
        "review": data['review'],
        "purchase": data['purchase'],
        "purchase_date": data['purchase_date'],
        "car_make": data['car_make'],
        "car_model": data['car_model'],
        "car_year": data['car_year'],
    });

    try {
        const savedReview = await review.save();
        res.json(savedReview);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error inserting review' });
    }
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
