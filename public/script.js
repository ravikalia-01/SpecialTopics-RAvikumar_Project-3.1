// Hotel Search Application
document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.getElementById('search-form');
    const resultsContainer = document.getElementById('results-container');
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorMessage = document.getElementById('error-message');

    // Initialize date inputs with default values
    initializeDateInputs();

    // Handle search form submission
    searchForm.addEventListener('submit', handleSearch);

    function initializeDateInputs() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);

        document.getElementById('check-in').value = formatDate(tomorrow);
        document.getElementById('check-out').value = formatDate(dayAfter);
    }

    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    async function handleSearch(e) {
        e.preventDefault();
        
        const location = document.getElementById('location').value.trim();
        const checkIn = document.getElementById('check-in').value;
        const checkOut = document.getElementById('check-out').value;
        const guests = document.getElementById('guests').value;

        // Validate inputs
        if (!location || !checkIn || !checkOut || !guests) {
            showError('Please fill in all required fields.');
            return;
        }

        // Show loading state
        showLoading(true);
        hideError();

        try {
            const response = await fetch(`/search-hotels?location=${encodeURIComponent(location)}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch hotels');
            }

            const hotels = await response.json();
            displayResults(hotels);

        } catch (error) {
            console.error('Error:', error);
            showError('Failed to search hotels. Please try again later.');
        } finally {
            showLoading(false);
        }
    }

    function displayResults(hotels) {
        resultsContainer.innerHTML = '';

        if (hotels.length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">No hotels found for your search criteria.</p>';
            return;
        }

        hotels.forEach(hotel => {
            const hotelCard = createHotelCard(hotel);
            resultsContainer.appendChild(hotelCard);
        });
    }

    function createHotelCard(hotel) {
        const card = document.createElement('div');
        card.className = 'hotel-card';
        
        // Format price with currency
        const formattedPrice = hotel.price ? `$${hotel.price}` : 'Price not available';
        
        // Format rating
        const rating = hotel.rating || 0;
        const stars = '★'.repeat(Math.floor(rating));
        const emptyStars = '☆'.repeat(5 - Math.floor(rating));
        
        card.innerHTML = `
            <img src="${hotel.image || 'https://via.placeholder.com/250x150'}" alt="${hotel.name}" class="hotel-image" onerror="this.src='https://via.placeholder.com/250x150'">
            <div class="hotel-info">
                <h3 class="hotel-name">${hotel.name}</h3>
                <p class="hotel-location">${hotel.location}</p>
                <div class="hotel-rating">
                    <span class="stars">${stars}${emptyStars}</span>
                    <span class="rating-text">${rating}/5</span>
                </div>
                <p class="hotel-price">${formattedPrice} per night</p>
                <button class="book-btn" onclick="bookHotel('${hotel.id}')">Book Now</button>
            </div>
        `;
        
        return card;
    }

    function showLoading(show) {
        loadingSpinner.style.display = show ? 'block' : 'none';
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    function hideError() {
        errorMessage.style.display = 'none';
    }

    function bookHotel(hotelId) {
        alert(`Booking functionality for hotel ${hotelId} would be implemented here.`);
    }

    // Additional utility functions
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
});
