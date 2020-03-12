const range = require('express-range')
const compression = require('compression')

const express = require('express')

const data = require('./zips')
const CitiesDB = require('./zipsdb')

//Load application keys
const db = CitiesDB(data);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Start of workshop

// Mandatory workshop
// TODO GET /api/states
// Added by Andrew Goh, 2020-03-11.
app.get('/api/states',
	(req, resp) => { // Request handler
		const result = db.findAllStates();
		// status code
		resp.status(200)

		// set Content-Type
		resp.type('application/json')
		resp.set('X-generated-on', (new Date()).toDateString())
		resp.set('Access-Control-Allow-Origin', '*')
		resp.json(result)
	}
)

// TODO GET /api/state/:state
// Added by Andrew Goh, 2020-03-11.
app.get('/api/state/:state',
	(req, resp) => { // Request handler
		// Read the value from the route :state
		const state = req.params.state

		// Read the query string
		const offset = parseInt(req.query.offset) || 0;	// If parseInt returns False, default to 0.
		const limit = parseInt(req.query.limit) || 10;	// If parseInt returns False, default to 10.

		// Default 10 records
		const result = db.findCitiesByState(state,
			{offset, limit}		// Shortform if key = value variable.
			// {offset: offset, limit: limit}
		);
		// status code
		resp.status(200)

		// set Content-Type
		resp.type('application/json')
		resp.json(result)
	}
)

// TODO DELETE /api/city/:name
// Added by Andrew Goh, 2020-03-12.
app.delete('/api/city/:name',
	(req, resp) => { // Request handler
		const name = req.params.name

		// No DB service for delete.
		//const result = db.deleteByName(name)	
		//console.info(result)

		// Nevertheless, fake the response.
		// status code
		resp.status(200)

		// set Content-Type
		resp.type('application/json')
		resp.json({message: "Deleted: city = '"+name+"'"})
	}
)

// TODO GET /api/city/:cityId
// Added by Andrew Goh, 2020-03-11.
app.get('/api/city/:cityId',
	(req, resp) => { // Request handler
		const cityId = req.params.cityId

		const result = db.findCityById(cityId)
		//console.info(result)

		// status code
		resp.status(200)

		// set Content-Type
		resp.type('application/json')
		resp.json(result)
	}
)

// TODO POST /api/city
// Added by Andrew Goh, 2020-03-11.
// Content-Type: application/x-www-form-urlencoded
app.post('/api/city',
	(req, resp) => {
		const body = req.body;
		console.info('body =', body);

		// Validate body.
		if (!db.validateForm(body)) {
			resp.status(400)
			resp.type('application/json')
			resp.json({'message': 'Incomplete form'})
			return
		}
		// Passed validation
		// Insert data into database.
		// TODO loc = "number, number" => [ number, number ]

		// Convert loc 'number,number' => [ number, number ]
		const loc = body['loc'].split(',');
		var loc_new = new Array;
		loc_new[0] = parseInt(loc[0]);
		loc_new[1] = parseInt(loc[1]);
		body['loc'] = loc_new;
		
		// Convert 'pop' to integer values.
		body['pop'] = parseInt(body['pop']);
		console.info('loc_new =', loc_new);
		console.info('body (new) =', body);

		db.insertCity(body);

		resp.status(201)
		resp.type('application/json')
		resp.json({message: 'Created.', body})
	}
)

// Optional workshop
// TODO HEAD /api/state/:state
// IMPORTANT: HEAD must be place before GET for the
// same resource. Otherwise the GET handler will be invoked


// TODO GET /state/:state/count
// Added by Andrew Goh, 2020-03-11.
app.get('/api/state/:state/count',
	(req, resp) => { // Request handler
		const state = req.params.state
		const count = db.countCitiesInState(state)

		const result = {	// Create JSON object
			state: state,
			numOfCities: count,
			timestamp: (new Date()).toDateString()
		} 

		// status code
		resp.status(200)

		// set Content-Type
		resp.type('application/json')
		resp.json(result)
	}
)

// TODO GET /api/city/:name
// Added by Andrew Goh, 2020-03-11.
// Can't work, always return null; because conflict with resource '/api/city/:cityId'
// Changed resource to '/api/city/name/:name'.
app.get('/api/city/name/:name',
	(req, resp) => { // Request handler
		const name = req.params.name

		const result = db.findCitiesByName(name)
		// status code
		resp.status(200)

		// set Content-Type
		resp.type('application/json')
		resp.json(result)
	}
)

// End of workshop

const PORT = parseInt(process.argv[2] || process.env.APP_PORT) || 3000;
app.listen(PORT, () => {
	console.info(`Application started on port ${PORT} at ${new Date()}`);
});

