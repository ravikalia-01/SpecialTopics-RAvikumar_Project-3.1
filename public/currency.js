// Currency Converter JavaScript

class CurrencyConverter {
    constructor() {
        this.amountInput = document.getElementById('amount');
        this.fromCurrency = document.getElementById('from-currency');
        this.toCurrency = document.getElementById('to-currency');
        this.convertBtn = document.getElementById('convert-btn');
        this.swapBtn = document.getElementById('swap-currencies');
        this.resultContainer = document.getElementById('conversion-result');
        this.resultText = document.getElementById('result-text');
        this.exchangeRate = document.getElementById('exchange-rate');
        this.lastUpdated = document.getElementById('last-updated');
        this.loadingSpinner = document.getElementById('loading-spinner');
        this.errorMessage = document.getElementById('error-message');
        
        this.rates = null;
        this.lastFetchTime = null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadExchangeRates();
        this.setupQuickButtons();
    }
    
    bindEvents() {
        this.convertBtn.addEventListener('click', () => this.convertCurrency());
        this.swapBtn.addEventListener('click', () => this.swapCurrencies());
        
        // Allow Enter key to trigger conversion
        this.amountInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.convertCurrency();
            }
        });
    }
    
    setupQuickButtons() {
        const quickButtons = document.querySelectorAll('.quick-btn');
        quickButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const from = btn.dataset.from;
                const to = btn.dataset.to;
                
                this.fromCurrency.value = from;
                this.toCurrency.value = to;
                this.convertCurrency();
            });
        });
    }
    
    async loadExchangeRates() {
        try {
            this.showLoading(true);
            
            // Using a free exchange rate API
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            
            if (!response.ok) {
                throw new Error('Failed to fetch exchange rates');
            }
            
            const data = await response.json();
            this.rates = data.rates;
            this.lastFetchTime = new Date();
            
            this.showLoading(false);
            this.hideError();
            
        } catch (error) {
            console.error('Error loading exchange rates:', error);
            this.showError('Failed to load exchange rates. Using cached rates.');
            
            // Fallback to cached rates if available
            this.loadCachedRates();
        }
    }
    
    loadCachedRates() {
        // Fallback rates as of 2024
        this.rates = {
            USD: 1,
            EUR: 0.85,
            GBP: 0.73,
            JPY: 110.5,
            CAD: 1.25,
            AUD: 1.35,
            CHF: 0.92,
            CNY: 6.45,
            INR: 74.5,
            MXN: 20.1
        };
        this.lastFetchTime = new Date();
        this.showLoading(false);
    }
    
    convertCurrency() {
        if (!this.rates) {
            this.showError('Exchange rates not loaded. Please try again.');
            return;
        }
        
        const amount = parseFloat(this.amountInput.value);
        const fromCurrency = this.fromCurrency.value;
        const toCurrency = this.toCurrency.value;
        
        if (isNaN(amount) || amount <= 0) {
            this.showError('Please enter a valid amount.');
            return;
        }
        
        // Convert to USD first, then to target currency
        const amountInUSD = amount / this.rates[fromCurrency];
        const convertedAmount = amountInUSD * this.rates[toCurrency];
        
        const rate = this.rates[toCurrency] / this.rates[fromCurrency];
        
        this.displayResult(amount, fromCurrency, convertedAmount, toCurrency, rate);
    }
    
    displayResult(amount, fromCurrency, convertedAmount, toCurrency, rate) {
        const formattedFrom = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: fromCurrency,
            minimumFractionDigits: 2
        }).format(amount);
        
        const formattedTo = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: toCurrency,
            minimumFractionDigits: 2
        }).format(convertedAmount);
        
        this.resultText.textContent = `${formattedFrom} = ${formattedTo}`;
        this.exchangeRate.textContent = `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
        this.lastUpdated.textContent = `Last updated: ${this.lastFetchTime.toLocaleString()}`;
        
        this.resultContainer.style.display = 'block';
        this.hideError();
    }
    
    swapCurrencies() {
        const temp = this.fromCurrency.value;
        this.fromCurrency.value = this.toCurrency.value;
        this.toCurrency.value = temp;
        
        // Auto-convert after swapping
        if (this.amountInput.value) {
            this.convertCurrency();
        }
    }
    
    showLoading(show) {
        this.loadingSpinner.style.display = show ? 'block' : 'none';
        this.convertBtn.disabled = show;
    }
    
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        this.resultContainer.style.display = 'none';
    }
    
    hideError() {
        this.errorMessage.style.display = 'none';
    }
}

// Initialize the currency converter when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CurrencyConverter();
});
