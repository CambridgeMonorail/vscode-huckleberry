import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import styles from './index.module.css';

function HomepageHeader(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <img
          src={useBaseUrl('/img/huckleberry-logo-with-name.svg')}
          alt="Huckleberry Logo"
          className={styles.heroLogo}
          width={300}
        />
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/quick-start"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

/**
 * Displays the inspiration section, explaining Huckleberry's origins and purpose
 */
function InspirationSection(): JSX.Element {
  return (
    <section className={styles.inspiration}>
      <div className="container">
        <div className="row">
          <div className="col col--12">
            <h2 className={styles.inspirationTitle}>
              🍇 A VS Code Native Take on AI Task Management
            </h2>
            <div className={styles.inspirationContent}>
              <p>
                Huckleberry was born out of admiration for{' '}
                <a
                  href="https://github.com/eyaltoledano/claude-task-master"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Claude Task Master
                </a>
                , a sharp bit of thinking that showed just how far a language
                model can go when you let it run the planning meeting.
              </p>
              <p>
                But we wanted something built natively for the place most of us
                actually work: VS Code.
              </p>
              <p>
                So, we made Huckleberry. It lives in your editor as a proper
                chat participant, powered by the same models as GitHub Copilot.
                No shell scripts. No arcane installs. Just you, your project,
                and a clever assistant that's already up to speed.
              </p>
              <p>
                It's the same idea as Task Master, just reimagined as a native
                extension. Less copy-paste. More get-on-with-it.
              </p>
              <p>
                Ask it to untangle a PRD. Let it sketch your next move. Tick
                things off. Break things down. Reprioritise. All in plain
                English, in the same place you write your code.
              </p>
              <p>
                If you liked Task Master, Huckleberry might just be your
                huckleberry.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Displays an introductory video about Huckleberry
 */
function VideoSection(): JSX.Element {
  return (
    <section className={styles.videoSection}>
      <div className="container">
        <div className="row">
          <div className="col col--12">
            <div className={styles.videoWrapper}>
              <iframe
                className={styles.responsiveVideo}
                src="https://www.youtube.com/embed/NnjEhP-Swmc?si=8EAQBMwwfV80UwTp"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="AI-powered task management inside Visual Studio Code"
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <VideoSection />
        <InspirationSection />
      </main>
    </Layout>
  );
}
