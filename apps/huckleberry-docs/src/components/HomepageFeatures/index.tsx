import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Natural Language Interface',
    Svg: require('@site/static/img/features/natural-language.svg').default,
    description: (
      <>
        Manage tasks through simple, conversational language directly in VS Code's chat interface. 
        Create, update, and query tasks using natural language commands.
      </>
    ),
  },
  {
    title: 'AI Integration',
    Svg: require('@site/static/img/features/ai-integration.svg').default,
    description: (
      <>
        Powered by VS Code's Language Model API, Huckleberry creates a conversational interface for 
        automated task management without leaving your development environment.
      </>
    ),
  },
  {
    title: 'Local Storage & Version Control',
    Svg: require('@site/static/img/features/local-storage.svg').default,
    description: (
      <>
        All task data is stored as plain text files in your workspace, making it easy to version control, 
        share with your team, and keep your task data alongside your code.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
