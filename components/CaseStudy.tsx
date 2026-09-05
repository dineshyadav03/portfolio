"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { CaseStudy as CaseStudyData } from "@/lib/content";
import { fadeUp, listContainer, listItem, revealOnce } from "@/lib/motion";
import styles from "./CaseStudy.module.css";

// Every image here is a real, generated figure the project's author made
// specifically for this case study (see lib/content.ts's own comment on
// `CaseStudy.images`) — not stock art, not a placeholder. Rendered as a
// plain `<figure>` with the same bordered-card language the rest of this
// component already uses, so an image reads as one more piece of real
// content, not a decorative banner bolted onto the page.
function Figure({ image }: { image: { src: string; width: number; height: number; alt: string } }) {
  return (
    <figure className={styles.figure}>
      <Image src={image.src} width={image.width} height={image.height} alt={image.alt} className={styles.figureImg} />
    </figure>
  );
}

// Renders the optional richer `Project.caseStudy` — everything here is the
// real project's own written material (see lib/content.ts), reformatted
// into the site's terminal voice, not summarized or invented. Deliberately
// excludes the source document's own "portfolio kit" (resume bullets,
// interview-prep answers) — that's private prep material for the project's
// author to use elsewhere, not visitor-facing case-study copy.
export default function CaseStudy({ data }: { data: CaseStudyData }) {
  return (
    <div className={styles.wrap}>
      {data.images && <Figure image={data.images.cover} />}

      <motion.blockquote
        className={styles.pitch}
        initial="hidden"
        whileInView="show"
        viewport={revealOnce}
        variants={fadeUp}
      >
        “{data.pitch}”
      </motion.blockquote>

      <motion.section
        className={styles.section}
        initial="hidden"
        whileInView="show"
        viewport={revealOnce}
        variants={fadeUp}
      >
        <h3 className={styles.heading}>the real-world problem</h3>
        <p className={styles.body}>{data.problemIntro}</p>
        {data.images && <Figure image={data.images.problemFacts} />}
        <ul className={styles.statList}>
          {data.problemStats.map((stat) => (
            <li key={stat}>{stat}</li>
          ))}
        </ul>
        {data.images && <Figure image={data.images.attackPatterns} />}
        <div className={styles.scenarios}>
          {data.scenarios.map((s) => (
            <div className={styles.scenario} key={s.title}>
              <span className={styles.scenarioTag}>{s.tag}</span>
              <p className={styles.scenarioTitle}>{s.title}</p>
              <p className={styles.scenarioBody}>{s.body}</p>
            </div>
          ))}
        </div>
        <p className={styles.body}>{data.problemClosing}</p>
      </motion.section>

      <motion.section
        className={styles.section}
        initial="hidden"
        whileInView="show"
        viewport={revealOnce}
        variants={fadeUp}
      >
        <h3 className={styles.heading}>architecture — six agents, one state graph</h3>
        <p className={styles.body}>{data.architectureIntro}</p>
        {data.images && <Figure image={data.images.architecture} />}
        <dl className={styles.stageList}>
          {data.stages.map((s) => (
            <div className={styles.stageRow} key={s.stage}>
              <dt className={styles.stageName}>{s.stage}</dt>
              <dd className={styles.stageRole}>{s.role}</dd>
            </div>
          ))}
        </dl>
        <p className={styles.note}>{data.architectureNote}</p>
        {data.images && <Figure image={data.images.graphRag} />}
      </motion.section>

      <motion.section
        className={styles.section}
        initial="hidden"
        whileInView="show"
        viewport={revealOnce}
        variants={fadeUp}
      >
        <h3 className={styles.heading}>stack — everything wired to the live service</h3>
        <dl className={styles.stageList}>
          {data.stackTable.map((row) => (
            <div className={styles.stageRow} key={row.layer}>
              <dt className={styles.stageName}>
                {row.layer}
                <span className={styles.stackChoice}>{row.choice}</span>
              </dt>
              <dd className={styles.stageRole}>{row.detail}</dd>
            </div>
          ))}
        </dl>
      </motion.section>

      <motion.section
        className={styles.section}
        initial="hidden"
        whileInView="show"
        viewport={revealOnce}
        variants={fadeUp}
      >
        <h3 className={styles.heading}>the build log — what actually broke</h3>
        <p className={styles.body}>{data.buildLogIntro}</p>
        <motion.div initial="hidden" whileInView="show" viewport={revealOnce} variants={listContainer}>
          {data.phases.map((phase) => (
            <motion.div className={styles.phase} key={phase.title} variants={listItem}>
              <p className={styles.phaseTitle}>{phase.title}</p>
              {phase.entries.map((entry, i) => (
                <div className={styles.entry} key={i}>
                  {entry.fields.map((f) => (
                    <p className={styles.entryField} key={f.label}>
                      <span className={styles.entryLabel}>{f.label}:</span> {f.text}
                    </p>
                  ))}
                </div>
              ))}
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      <motion.section
        className={styles.section}
        initial="hidden"
        whileInView="show"
        viewport={revealOnce}
        variants={fadeUp}
      >
        <h3 className={styles.heading}>skills this demonstrates</h3>
        <dl className={styles.stageList}>
          {data.skills.map((s) => (
            <div className={styles.stageRow} key={s.area}>
              <dt className={styles.stageName}>{s.area}</dt>
              <dd className={styles.stageRole}>{s.detail}</dd>
            </div>
          ))}
        </dl>
      </motion.section>

      <motion.section
        className={styles.section}
        initial="hidden"
        whileInView="show"
        viewport={revealOnce}
        variants={fadeUp}
      >
        <h3 className={styles.heading}>what&apos;s genuinely still open</h3>
        <ul className={styles.statList}>
          {data.openItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </motion.section>
    </div>
  );
}
