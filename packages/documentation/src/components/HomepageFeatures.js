import React from "react";
import clsx from "clsx";
import styles from "./HomepageFeatures.module.css";

const FeatureList = [
  {
    title: "Easy to Use",
    Svg: require("../../static/img/undraw_docusaurus_mountain.svg").default,
    description: (
      <>
        yarn.build can discover how to build and test your packages, and
        provides simple config for when it can&aops;t.
      </>
    ),
  },
  {
    title: "Only Builds What's Changed",
    Svg: require("../../static/img/undraw_docusaurus_tree.svg").default,
    description: (
      <>
        yarn.build keeps track of whats changed, and will only rebuild packages
        with changes, that are also dependencies.
      </>
    ),
  },
  {
    title: "Super Fast Builds",
    Svg: require("../../static/img/undraw_docusaurus_react.svg").default,
    description: (
      <>
        Builds are run in parallel just like other modern build tools, taking
        advantage of every core you have. <br />
        <small>
          or less with <code>--max-concurrency</code>
        </small>
      </>
    ),
  },
];

function Feature({ Svg, title, description }) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <Svg className={styles.featureSvg} alt={title} />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
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
