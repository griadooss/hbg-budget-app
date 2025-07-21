/**
 * HBG Financial Transparency Widget
 * Drop-in JavaScript component for homesbeforegrowth.org
 * 
 * Usage: 
 * <div id="hbg-financial-widget"></div>
 * <script src="financial-widget.js"></script>
 */

class HBGFinancialWidget {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.apiBase = options.apiBase || 'https://api.homesbeforegrowth.org';
    this.container = document.getElementById(containerId);
    this.theme = options.theme || 'default';
    this.showRecent = options.showRecent !== false;
    this.maxCategories = options.maxCategories || 5;
    
    if (!this.container) {
      console.error(`HBG Financial Widget: Container #${containerId} not found`);
      return;
    }
    
    this.init();
  }
  
  async init() {
    this.showLoading();
    
    try {
      const data = await this.fetchFinancialData();
      this.render(data);
    } catch (error) {
      console.error('Failed to load financial data:', error);
      this.showError();
    }
  }
  
  async fetchFinancialData() {
    const response = await fetch(`${this.apiBase}/api/public/financial-summary`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  showLoading() {
    this.container.innerHTML = `
      <div class="hbg-widget hbg-loading">
        <div class="loading-spinner"></div>
        <p>Loading financial data...</p>
      </div>
    `;
  }
  
  showError() {
    this.container.innerHTML = `
      <div class="hbg-widget hbg-error">
        <h3>Financial Transparency</h3>
        <p>Financial data is temporarily unavailable. Please check back later.</p>
        <p><small>For the latest information, contact us directly.</small></p>
      </div>
    `;
  }
  
  render(data) {
    const { summary, expensesByCategory, recentTransactions, financialYear, party } = data;
    
    const topCategories = expensesByCategory
      .slice(0, this.maxCategories)
      .filter(cat => cat.amount > 0);
    
    const recentTxs = this.showRecent 
      ? recentTransactions.slice(0, 3)
      : [];
    
    this.container.innerHTML = `
      <div class="hbg-widget hbg-${this.theme}">
        <div class="widget-header">
          <h3>Financial Transparency</h3>
          <span class="financial-year">${financialYear}</span>
        </div>
        
        <div class="financial-summary">
          <div class="summary-grid">
            <div class="metric income">
              <span class="label">Total Income</span>
              <span class="value">$${this.formatCurrency(summary.totalIncome)}</span>
            </div>
            <div class="metric expenses">
              <span class="label">Total Expenses</span>
              <span class="value">$${this.formatCurrency(summary.totalExpenses)}</span>
            </div>
            <div class="metric net ${summary.netPosition >= 0 ? 'positive' : 'negative'}">
              <span class="label">Net Position</span>
              <span class="value">$${this.formatCurrency(summary.netPosition)}</span>
            </div>
          </div>
        </div>
        
        ${topCategories.length > 0 ? `
          <div class="expense-breakdown">
            <h4>Where Funds Are Used</h4>
            <div class="categories">
              ${topCategories.map(cat => `
                <div class="category-item">
                  <span class="category-name">${cat.category}</span>
                  <span class="category-amount">$${this.formatCurrency(cat.amount)}</span>
                  <div class="category-bar">
                    <div class="bar-fill" style="width: ${(cat.amount / topCategories[0].amount) * 100}%"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        ${recentTxs.length > 0 ? `
          <div class="recent-activity">
            <h4>Recent Activity</h4>
            <div class="transactions">
              ${recentTxs.map(tx => `
                <div class="transaction-item">
                  <span class="tx-date">${this.formatDate(tx.date)}</span>
                  <span class="tx-description">${this.truncate(tx.description, 30)}</span>
                  <span class="tx-amount ${tx.type.toLowerCase()}">
                    ${tx.type === 'Income' ? '+' : '-'}$${this.formatCurrency(tx.amount)}
                  </span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        <div class="widget-footer">
          <p class="transparency-note">
            <small>
              We believe in complete financial transparency. 
              <a href="/transparency" class="view-more">View detailed reports →</a>
            </small>
          </p>
          <p class="last-updated">
            <small>Last updated: ${this.formatDate(data.lastUpdated)}</small>
          </p>
        </div>
      </div>
    `;
    
    this.addStyles();
  }
  
  formatCurrency(amount) {
    return Math.abs(amount).toLocaleString('en-AU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }
  
  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
  
  truncate(text, length) {
    return text.length > length ? text.substring(0, length) + '...' : text;
  }
  
  addStyles() {
    // Only add styles once
    if (document.getElementById('hbg-widget-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'hbg-widget-styles';
    style.textContent = `
      .hbg-widget {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        border: 1px solid #e1e5e9;
        border-radius: 8px;
        padding: 20px;
        background: #ffffff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        max-width: 500px;
        margin: 20px 0;
      }
      
      .hbg-widget.hbg-loading,
      .hbg-widget.hbg-error {
        text-align: center;
        padding: 40px 20px;
      }
      
      .loading-spinner {
        border: 3px solid #f3f3f3;
        border-top: 3px solid #2563eb;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        animation: spin 1s linear infinite;
        margin: 0 auto 15px;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .widget-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 2px solid #f8f9fa;
        padding-bottom: 10px;
      }
      
      .widget-header h3 {
        margin: 0;
        color: #1f2937;
        font-size: 1.25rem;
        font-weight: 600;
      }
      
      .financial-year {
        font-size: 0.875rem;
        color: #6b7280;
        font-weight: 500;
      }
      
      .summary-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
        margin-bottom: 20px;
      }
      
      .metric {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 6px;
      }
      
      .metric.income { border-left: 4px solid #10b981; }
      .metric.expenses { border-left: 4px solid #f59e0b; }
      .metric.net.positive { border-left: 4px solid #10b981; }
      .metric.net.negative { border-left: 4px solid #ef4444; }
      
      .metric .label {
        font-weight: 500;
        color: #4b5563;
      }
      
      .metric .value {
        font-weight: 600;
        font-size: 1.1rem;
      }
      
      .metric.income .value { color: #059669; }
      .metric.expenses .value { color: #d97706; }
      .metric.net.positive .value { color: #059669; }
      .metric.net.negative .value { color: #dc2626; }
      
      .expense-breakdown,
      .recent-activity {
        margin: 20px 0;
      }
      
      .expense-breakdown h4,
      .recent-activity h4 {
        margin: 0 0 12px 0;
        color: #374151;
        font-size: 1rem;
        font-weight: 600;
      }
      
      .category-item {
        margin-bottom: 8px;
      }
      
      .category-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      
      .category-name {
        font-size: 0.875rem;
        color: #4b5563;
        flex: 1;
      }
      
      .category-amount {
        font-size: 0.875rem;
        font-weight: 500;
        color: #1f2937;
        margin-left: 8px;
      }
      
      .category-bar {
        width: 60px;
        height: 4px;
        background: #e5e7eb;
        border-radius: 2px;
        margin-left: 8px;
        overflow: hidden;
      }
      
      .bar-fill {
        height: 100%;
        background: #3b82f6;
        transition: width 0.3s ease;
      }
      
      .transaction-item {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 8px;
        padding: 6px 0;
        border-bottom: 1px solid #f3f4f6;
        font-size: 0.875rem;
      }
      
      .transaction-item:last-child {
        border-bottom: none;
      }
      
      .tx-date {
        color: #6b7280;
        font-size: 0.8rem;
      }
      
      .tx-description {
        color: #4b5563;
      }
      
      .tx-amount {
        font-weight: 500;
        text-align: right;
      }
      
      .tx-amount.income { color: #059669; }
      .tx-amount.expense { color: #dc2626; }
      
      .widget-footer {
        margin-top: 20px;
        border-top: 1px solid #f3f4f6;
        padding-top: 12px;
      }
      
      .transparency-note {
        margin: 0 0 8px 0;
      }
      
      .view-more {
        color: #2563eb;
        text-decoration: none;
        font-weight: 500;
      }
      
      .view-more:hover {
        text-decoration: underline;
      }
      
      .last-updated {
        margin: 0;
        color: #9ca3af;
      }
      
      /* Responsive design */
      @media (min-width: 640px) {
        .summary-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }
    `;
    
    document.head.appendChild(style);
  }
}

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', function() {
  // Default initialization
  if (document.getElementById('hbg-financial-widget')) {
    new HBGFinancialWidget('hbg-financial-widget');
  }
  
  // Homepage summary (minimal version)
  if (document.getElementById('hbg-financial-summary')) {
    new HBGFinancialWidget('hbg-financial-summary', {
      showRecent: false,
      maxCategories: 3
    });
  }
});

// Make class available globally
window.HBGFinancialWidget = HBGFinancialWidget; 