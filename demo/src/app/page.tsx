import React from 'react';
import type { Metadata } from 'next';
import { BusinessLeadForm } from '@/components/BusinessLeadForm';

export const metadata: Metadata = {
  title: 'Alder Office Services | ResponseLock portfolio demo',
  description:
    'Dependable office and commercial cleaning, thoughtfully planned around your team and your space.',
};

const services = [
  {
    number: '01',
    title: 'Office cleaning',
    text: 'A considered clean for desks, shared spaces, kitchens and the details people notice every day.',
    icon: '✳',
  },
  {
    number: '02',
    title: 'Common areas',
    text: 'Welcoming lobbies, meeting rooms and corridors, ready for the people who walk through them.',
    icon: '⌂',
  },
  {
    number: '03',
    title: 'Floor care',
    text: 'Practical care for hard floors and carpet, planned to suit the finish and rhythm of your workplace.',
    icon: '◌',
  },
];

const steps = [
  ['01', 'Tell us about your space', 'A short conversation gives us a feel for your site, schedule and priorities.'],
  ['02', 'Get a clear plan', 'We walk through the details and outline a straightforward, tailored cleaning plan.'],
  ['03', 'Settle into a better rhythm', 'Your team arrives to a space that feels cared for, with a familiar point of contact.'],
];

export default function HomePage(): React.ReactElement {
  return (
    <div className="alder-site" id="top">
      <div className="portfolio-note" role="note">
        <span className="portfolio-note__dot" aria-hidden="true" />
        Fictional business · portfolio sample
      </div>

      <header className="alder-header">
        <a className="alder-brand" href="#top" aria-label="Alder Office Services home">
          <span className="alder-brand__mark" aria-hidden="true"><i /><i /><i /></span>
          <span className="alder-brand__text">alder<span>office services</span></span>
        </a>
        <nav className="alder-nav" aria-label="Main navigation">
          <a href="#services">Services</a>
          <a href="#approach">Our approach</a>
          <a href="#about">About Alder</a>
        </nav>
        <a className="button button--nav" href="#consultation">Request a walkthrough <span aria-hidden="true">↗</span></a>
      </header>

      <main id="main-content">
        <section className="alder-hero" aria-labelledby="hero-title">
          <div className="alder-hero__copy">
            <p className="eyebrow"><span /> A little more care in every corner</p>
            <h1 id="hero-title">A clearer space<br />for <em>better work.</em></h1>
            <p className="alder-hero__intro">
              Thoughtful commercial cleaning for offices and shared spaces. A dependable team, a considered plan, and one less thing on your mind.
            </p>
            <div className="alder-hero__actions">
              <a className="button button--primary" href="#consultation">Let’s talk about your space <span aria-hidden="true">↗</span></a>
              <a className="text-link" href="#services">Explore our services <span aria-hidden="true">↓</span></a>
            </div>
            <div className="hero-reassurance">
              <span className="hero-reassurance__icon" aria-hidden="true">✳</span>
              <p><strong>Made to fit your workplace.</strong><br />A practical plan that works around your people.</p>
            </div>
          </div>

          <div className="alder-hero__visual" aria-label="Illustration of a calm, sunlit modern office" role="img">
            <div className="visual-sun" />
            <div className="visual-window"><span /><span /><span /></div>
            <div className="visual-wall-art"><i /><i /><i /></div>
            <div className="visual-shelf"><i /><i /><i /><i /></div>
            <div className="visual-plant visual-plant--left"><i /><i /><i /><b /></div>
            <div className="visual-desk"><span /><i /><b /></div>
            <div className="visual-chair"><i /><b /></div>
            <div className="visual-plant visual-plant--right"><i /><i /><i /><b /></div>
            <div className="visual-caption"><span>01 — A fresh perspective</span><span>EST. TO FIT YOUR DAY</span></div>
          </div>
          <div className="hero-bottomline"><span>OFFICES · WORKSPACES · SHARED PLACES</span><span>GOOD WORK STARTS HERE <b>↓</b></span></div>
        </section>

        <section className="services-section section-wrap" id="services" aria-labelledby="services-title">
          <div className="section-heading">
            <div><p className="eyebrow"><span /> A thoughtful clean, from the ground up</p><h2 id="services-title">The right care for<br /><em>the way you work.</em></h2></div>
            <p className="section-heading__aside">Every workplace has its own pace. We shape a steady, dependable cleaning routine around yours.</p>
          </div>
          <div className="service-grid">
            {services.map((service) => (
              <article className="service-card" key={service.number}>
                <div className="service-card__top"><span>{service.number} / 03</span><span className="service-card__icon" aria-hidden="true">{service.icon}</span></div>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
                <a href="#consultation" aria-label={`Ask us about ${service.title}`}>Ask us about this <span aria-hidden="true">↗</span></a>
              </article>
            ))}
          </div>
        </section>

        <section className="approach-section" id="approach" aria-labelledby="approach-title">
          <div className="approach-inner section-wrap">
            <div className="approach-intro">
              <p className="eyebrow eyebrow--light"><span /> Simple by design</p>
              <h2 id="approach-title">A good clean.<br /><em>A good relationship.</em></h2>
              <p>We believe the best service is the one that quietly makes your day easier. Clear communication and familiar faces are part of the job.</p>
              <a className="button button--light" href="#consultation">Meet your cleaning partner <span aria-hidden="true">↗</span></a>
            </div>
            <ol className="process-list">
              {steps.map(([number, title, text]) => (
                <li key={number}>
                  <span className="process-list__number">{number}</span>
                  <div><h3>{title}</h3><p>{text}</p></div>
                  <span className="process-list__arrow" aria-hidden="true">↗</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="testimonial-section section-wrap" id="about" aria-label="A note from an Alder client">
          <div className="quote-mark" aria-hidden="true">“</div>
          <div className="quote-content">
            <p className="eyebrow"><span /> A note from a client</p>
            <blockquote>“It’s a relief to know the space is in good hands. The team is thoughtful, consistent, and easy to reach.”</blockquote>
            <div className="quote-credit"><span className="quote-avatar" aria-hidden="true">JM</span><span><strong>Jordan M.</strong><small>Office manager · Sample testimonial</small></span></div>
          </div>
          <div className="testimonial-aside"><span>✳</span><p>Good work happens in spaces that feel cared for.</p></div>
        </section>

        <section className="consultation-section" id="consultation" aria-labelledby="consultation-title">
          <div className="consultation-inner section-wrap">
            <div className="consultation-copy">
              <p className="eyebrow eyebrow--light"><span /> Start with a conversation</p>
              <h2 id="consultation-title">Let’s make room<br />for <em>better days.</em></h2>
              <p>Tell us a little about your workplace. We’ll follow up to understand what would make a difference for your team.</p>
              <div className="contact-note"><span aria-hidden="true">↗</span><span>Friendly, no-pressure conversations.<br />A plan that starts with what you need.</span></div>
            </div>
            <div className="lead-form-card"><BusinessLeadForm /></div>
          </div>
        </section>
      </main>

      <footer className="alder-footer">
        <a className="alder-brand alder-brand--footer" href="#top" aria-label="Alder Office Services, back to top">
          <span className="alder-brand__mark" aria-hidden="true"><i /><i /><i /></span>
          <span className="alder-brand__text">alder<span>office services</span></span>
        </a>
        <p>Thoughtful care for the places where good work happens.</p>
        <div className="alder-footer__links"><a href="#services">Services</a><a href="#consultation">Get in touch</a><a href="/audit">Verification details <span aria-hidden="true">↗</span></a></div>
        <small>© 2026 Alder Office Services <span>Fictional business · portfolio sample</span></small>
      </footer>
    </div>
  );
}
