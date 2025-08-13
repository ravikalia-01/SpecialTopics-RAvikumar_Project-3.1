const express = require("express");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5500;

// Middleware
app.use(express.static("public"));
app.use(express.json());

// Enable CORS for local development
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Search hotels endpoint - Enhanced with advanced filtering
app.get("/search-hotels", async (req, res) => {
  const { 
    location, 
    checkIn, 
    checkOut, 
    guests,
    minPrice,
    maxPrice,
    minRating,
    amenities,
    sortBy,
    sortOrder,
    page = 1,
    limit = 20
  } = req.query;

  // Validate required parameters
  if (!location) {
    return res.status(400).json({ error: "Location is required" });
  }

  try {
    // Check if RapidAPI configuration is available
    if (!process.env.RAPIDAPI_KEY) {
      console.error("Missing RapidAPI key configuration");
      return res.status(500).json({ error: "Server configuration error - API key missing" });
    }

    // Construct RapidAPI URL for xotelo hotel search
    const rapidApiUrl = `https://xotelo-hotel-prices.p.rapidapi.com/api/search`;
    
    // Build query parameters for xotelo API
    const queryParams = new URLSearchParams({
      query: location,
      location_type: 'accommodation'
    });

    const response = await fetch(`${rapidApiUrl}?${queryParams}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'xotelo-hotel-prices.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY || '1da018b19cmshf1e3c96c2341487p19f979jsn6d4e0a97e8e8',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed: ${response.status} - ${errorText}`);
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Handle empty results or transform data structure
    if (!data || !Array.isArray(data)) {
      return res.json([]);
    }
    
    // Transform xotelo API response to match frontend expectations
    let transformedData = data.map(hotel => ({
      id: hotel.id || hotel.hotel_id || Math.random().toString(36).substr(2, 9),
      name: hotel.name || hotel.hotel_name || 'Hotel Name Not Available',
      location: hotel.location || hotel.address || hotel.city || location,
      price: hotel.price || hotel.min_price || hotel.max_price || 0,
      image: hotel.image || hotel.image_url || 'https://via.placeholder.com/250x150',
      rating: hotel.rating || hotel.star_rating || hotel.review_score || 0,
      reviews: hotel.reviews || hotel.review_count || 0,
      amenities: hotel.amenities || [],
      description: hotel.description || 'No description available',
      coordinates: hotel.coordinates || null
    }));

    // Apply advanced filtering
    if (minPrice) {
      transformedData = transformedData.filter(hotel => hotel.price >= parseFloat(minPrice));
    }
    
    if (maxPrice) {
      transformedData = transformedData.filter(hotel => hotel.price <= parseFloat(maxPrice));
    }
    
    if (minRating) {
      transformedData = transformedData.filter(hotel => hotel.rating >= parseFloat(minRating));
    }
    
    if (amenities) {
      const requiredAmenities = amenities.split(',');
      transformedData = transformedData.filter(hotel => 
        requiredAmenities.every(amenity => 
          hotel.amenities && hotel.amenities.some(a => 
            a.toLowerCase().includes(amenity.toLowerCase())
          )
        )
      );
    }

    // Apply sorting
    const sortOrderValue = sortOrder === 'desc' ? -1 : 1;
    if (sortBy) {
      transformedData.sort((a, b) => {
        let valueA = a[sortBy];
        let valueB = b[sortBy];
        
        if (typeof valueA === 'string') {
          valueA = valueA.toLowerCase();
          valueB = valueB.toLowerCase();
        }
        
        if (valueA < valueB) return -1 * sortOrderValue;
        if (valueA > valueB) return 1 * sortOrderValue;
        return 0;
      });
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedData = transformedData.slice(startIndex, endIndex);

    // Return enhanced response with metadata
    res.json({
      hotels: paginatedData,
      total: transformedData.length,
      page: parseInt(page),
      totalPages: Math.ceil(transformedData.length / limit),
      hasMore: endIndex < transformedData.length
    });

  } catch (error) {
    console.error("Error fetching hotels:", error);
    res.status(500).json({ error: "Failed to fetch hotels. Please try again later." });
  }
});

// Currency converter endpoint
app.get("/convert-currency", async (req, res) => {
  const { amount, from, to } = req.query;

  if (!amount || !from || !to) {
    return res.status(400).json({ error: "Amount, from currency, and to currency are required" });
  }

  try {
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
    const data = await response.json();
    
    if (!data.rates || !data.rates[to]) {
      return res.status(400).json({ error: "Invalid currency code" });
    }

    const rate = data.rates[to];
    const convertedAmount = parseFloat(amount) * rate;

    res.json({
      amount: parseFloat(amount),
      from,
      to,
      rate,
      convertedAmount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error converting currency:", error);
    res.status(500).json({ error: "Failed to convert currency" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Environment variables loaded:`, {
    RAPIDAPI_KEY: process.env.RAPIDAPI_KEY ? "✓" : "✗",
    RAPIDAPI_HOST: process.env.RAPIDAPI_HOST ? "✓" : "✗"
  });
});
