
// ── PRELOADER
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    setTimeout(() => preloader.classList.add('hidden'), 400);
  }
});

// ── REVEAL ON SCROLL
const revEls = document.querySelectorAll('.reveal');
const revObs = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('vis'), i * 60);
    }
  });
}, { threshold: 0.08 });
revEls.forEach(r => revObs.observe(r));

// ── SKILL BARS on scroll
document.querySelectorAll('.skill-level-fill').forEach(bar => {
  const obs = new IntersectionObserver(en => {
    if (en[0].isIntersecting) { bar.classList.add('loaded'); obs.disconnect(); }
  }, { threshold: 0.5 });
  obs.observe(bar);
});

// ── NAV ACTIVE
const secs = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  let cur2 = '';
  secs.forEach(s => { if (window.scrollY >= s.offsetTop - 90) cur2 = s.id; });
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.style.color = a.getAttribute('href') === '#' + cur2 ? 'var(--green)' : '';
  });
});

// ── MOBILE NAV TOGGLE
const navToggle = document.getElementById('navToggle');
const navLinks = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navLinks.classList.remove('open');
    });
  });
}

// ── DYNAMIC YEAR
const yrSpan = document.getElementById('yr');
if (yrSpan) yrSpan.textContent = new Date().getFullYear();

// ── BACK TO TOP
const backToTop = document.getElementById('backToTop');
if (backToTop) {
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 500);
  });
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ── FORM VALIDATION
function validateField(input) {
  const errorEl = input.parentElement.querySelector('.f-error');
  let msg = '';

  if (input.required && !input.value.trim()) {
    msg = 'This field is required';
  } else if (input.type === 'email' && input.value.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.value.trim())) {
      msg = 'Please enter a valid email address';
    }
  }

  if (msg) {
    input.classList.add('invalid');
    if (errorEl) { errorEl.textContent = msg; errorEl.classList.add('show'); }
    return false;
  } else {
    input.classList.remove('invalid');
    if (errorEl) { errorEl.textContent = ''; errorEl.classList.remove('show'); }
    return true;
  }
}

// Attach blur validation to form fields
document.querySelectorAll('#cForm .f-input, #cForm .f-textarea').forEach(input => {
  input.addEventListener('blur', () => validateField(input));
  input.addEventListener('input', () => {
    if (input.classList.contains('invalid')) validateField(input);
  });
});

// ── CONTACT FORM SUBMIT
const cForm = document.getElementById('cForm');
if (cForm) {
  cForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = this.querySelector('.f-submit');
    const msg = document.getElementById('fMsg');

    // Validate all fields
    const inputs = this.querySelectorAll('.f-input, .f-textarea');
    let valid = true;
    inputs.forEach(input => {
      if (!validateField(input)) valid = false;
    });
    if (!valid) return;

    const data = Object.fromEntries(new FormData(this));
    btn.textContent = 'Sending...'; btn.disabled = true;
    try {
      const res = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        msg.style.display = 'block'; msg.className = 'f-msg ok';
        msg.textContent = '✓ Message sent! I\'ll get back to you soon.';
        this.reset();
        inputs.forEach(i => { i.classList.remove('invalid'); });
        this.querySelectorAll('.f-error').forEach(e => { e.textContent = ''; e.classList.remove('show'); });
      } else if (res.status === 429) {
        msg.style.display = 'block'; msg.className = 'f-msg err';
        msg.textContent = '✗ Too many requests. Please try again later.';
      } else {
        msg.style.display = 'block'; msg.className = 'f-msg err';
        msg.textContent = '✗ Error sending message. Please try again.';
      }
    } catch (err) {
      msg.style.display = 'block'; msg.className = 'f-msg err';
      msg.textContent = '✗ Network error. Please try again.';
    } finally {
      btn.textContent = 'Send Message →'; btn.disabled = false;
    }
  });
}
