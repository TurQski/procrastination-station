import Link from "next/link";
import { GoalPlanner } from "@/components/goal-planner";
export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="Procrastination Station home"><span className="brand-mark" aria-hidden="true">p<span>.</span></span><span>procrastination<br />station<span className="brand-dot">.</span></span></Link>
        <nav aria-label="Main navigation"><a href="#how-it-works">How it works</a><a className="nav-cta" href="#goal-form">Find your first step <span aria-hidden="true">↗</span></a></nav>
      </header>
      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy min-w-0">
            <p className="eyebrow"><span className="status-dot" /> A LITTLE MOMENTUM GOES A LONG WAY</p>
            <h1 id="hero-title">Big goals.<br />Small steps.<br /><span>Let’s get going.</span></h1>
            <p className="intro">For the thing you’ve been putting off. Turn that overwhelming goal into a plan you can actually start.</p>
            <div className="route" aria-label="From someday to started"><span className="route-stop">Someday</span><span className="route-track" aria-hidden="true"><i /><i /><i /></span><span className="route-arrival">Started <span aria-hidden="true">↗</span></span></div>
            <p className="gentle-note">You don’t need all the motivation. Just a first step.</p>
          </div>
          <GoalPlanner />
        </section>
        <section id="how-it-works" className="how-section" aria-labelledby="how-title">
          <div className="section-heading"><p className="eyebrow">LESS OVERTHINKING. MORE DOING.</p><h2 id="how-title">A big idea, made approachable.</h2></div>
          <div className="steps-grid">
            <article><span className="step-number">01 / UNLOAD</span><h3>Get it out of your head.</h3><p>A project, a chore, a thing you keep avoiding. Give it a name and a little time.</p></article>
            <article><span className="step-number">02 / BREAK IT DOWN</span><h3>Make the next step smaller.</h3><p>Preview five practical stages with time estimates and suggested dates.</p></article>
            <article><span className="step-number">03 / MAKE IT YOURS</span><h3>Start with a starting point.</h3><p>Use the preview to find your first move. Adjust the goal and try it again.</p></article>
          </div>
        </section>
      </main>
      <footer><Link className="footer-brand" href="/">procrastination station.</Link><p>A little structure. A lot less pressure.</p><span>ONE STEP IS A START ↗</span></footer>
    </>
  );
}
