/* ============================================
   PELICAN LAKE CUP — JavaScript
   ============================================ */

// ===== EVENT DATE =====
// Change this to the actual event date when confirmed
const EVENT_DATE = new Date('2027-09-01T08:00:00');

// ===== Countdown Timer =====
function updateCountdown() {
  const now = new Date();
  const diff = EVENT_DATE - now;

  if (diff <= 0) {
    document.querySelectorAll('.countdown-number').forEach(el => el.textContent = '0');
    const label = document.querySelector('.hero-badge');
    if (label) label.textContent = "It's Game Time!";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const el = (id) => document.getElementById(id);
  if (el('days')) el('days').textContent = days;
  if (el('hours')) el('hours').textContent = hours;
  if (el('minutes')) el('minutes').textContent = minutes;
  if (el('seconds')) el('seconds').textContent = seconds;
}

// Run countdown on pages that have it
if (document.getElementById('days')) {
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// ===== Mobile Nav Toggle =====
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

// Close mobile nav when a link is clicked
if (navLinks) {
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
    });
  });
}

// ===== Active Nav Highlight =====
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPage || (currentPage === '' && href === 'index.html')) {
    link.classList.add('active');
  }
});

// ===== Sign-Up Form =====
// Sign-up form is handled by FormSubmit.co (no JS needed)
// Submissions go directly to peterlundquist33@gmail.com
