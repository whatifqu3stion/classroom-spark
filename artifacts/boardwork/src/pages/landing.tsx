import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Link } from "wouter";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  Clock3,
  Expand,
  FolderHeart,
  Menu,
  Monitor,
  NotebookPen,
  PencilLine,
  X,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const MOTION = {
  fast: 0.16,
  menu: 0.2,
  example: 0.18,
  reveal: 0.72,
  hero: 0.9,
  stagger: 0.08,
} as const;
const EASE = [0.16, 1, 0.3, 1] as const;
const motionTokens = {
  "--landing-motion-fast": `${MOTION.fast}s`,
  "--landing-motion-menu": `${MOTION.menu}s`,
  "--landing-motion-example": `${MOTION.example}s`,
  "--landing-ease": `cubic-bezier(${EASE.join(",")})`,
} as CSSProperties;

const examples = [
  {
    id: "science",
    subject: "Science",
    className: "Grade 6 · Science",
    unit: "Cells & systems",
    duration: 7,
    title: "Which cell is in trouble?",
    task: "Sketch a cell in fresh water and a cell in very salty water. Predict how each one changes.",
    prompts: [
      "Show the direction water moves.",
      "Use osmosis to explain your prediction.",
    ],
    materials: "Notebook + pencil",
    theme: "sky",
  },
  {
    id: "design",
    subject: "Design",
    className: "Grade 8 · Design",
    unit: "Designing for others",
    duration: 5,
    title: "One toy. Two possibilities.",
    task: "Sketch two ways to make a cardboard toy move. Circle the idea you would test first.",
    prompts: [
      "What makes it easy for a younger child to use?",
      "What would you change after the first test?",
    ],
    materials: "Sketchbook + pencil",
    theme: "sage",
  },
  {
    id: "language",
    subject: "Language",
    className: "Grade 7 · Language",
    unit: "Voice & perspective",
    duration: 5,
    title: "Same scene. A different story.",
    task: "Describe a rainy morning in three sentences. Make it feel hopeful without using the word happy.",
    prompts: [
      "Choose one detail your reader can hear.",
      "Underline the word that does the most work.",
    ],
    materials: "Notebook + pencil",
    theme: "peach",
  },
] as const;
type Example = (typeof examples)[number];

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={false}
      whileInView={reduced ? undefined : { opacity: [0.9, 1], y: [18, 0] }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: MOTION.reveal, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function ExampleBoard({
  example,
  large = false,
}: {
  example: Example;
  large?: boolean;
}) {
  return (
    <div
      className={`landing-board landing-board--${example.theme}${large ? " landing-board--large" : ""}`}
    >
      <div className="landing-board-top">
        <span>Start here</span>
        <span>
          <Clock3 aria-hidden="true" /> {example.duration} min
        </span>
      </div>
      <h3>{example.title}</h3>
      <p className="landing-board-task">{example.task}</p>
      <ul>
        {example.prompts.map((prompt) => (
          <li key={prompt}>{prompt}</li>
        ))}
      </ul>
      <div className="landing-board-bottom">
        <NotebookPen aria-hidden="true" />
        <span>{example.materials}</span>
        <span>Get settled. Get curious.</span>
      </div>
    </div>
  );
}

function BoardDemo() {
  const [subject, setSubject] = useState("science");
  const reduced = useReducedMotion();
  const current =
    examples.find((example) => example.id === subject) ?? examples[0];
  return (
    <figure className="landing-demo landing-glass" id="example-board">
      <div className="landing-demo-toolbar">
        <span className="landing-demo-brand">
          <BrandMark /> Boardwork
        </span>
        <span className="landing-demo-mode">
          A little context. A clear first task.
        </span>
        <span className="landing-demo-status">
          <CheckCheck aria-hidden="true" /> Ready for class
        </span>
      </div>
      <Tabs
        value={subject}
        onValueChange={setSubject}
        className="landing-demo-workspace"
      >
        <div className="landing-demo-controls">
          <span>Try a subject</span>
          <TabsList
            aria-label="Example subject"
            className="landing-subject-tabs"
          >
            {examples.map((example) => (
              <TabsTrigger key={example.id} value={example.id}>
                {example.subject}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {examples.map((example) => (
          <TabsContent
            key={example.id}
            value={example.id}
            className="landing-demo-content"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={example.id}
                initial={reduced ? false : { opacity: 0.65, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0.65 }}
                transition={{
                  duration: reduced ? 0 : MOTION.example,
                  ease: EASE,
                }}
              >
                <div className="landing-demo-context">
                  <span>{example.className}</span>
                  <span>{example.unit}</span>
                </div>
                <ExampleBoard example={example} />
              </motion.div>
            </AnimatePresence>
          </TabsContent>
        ))}
        <div className="landing-demo-footer">
          <figcaption>
            Illustrative activities · explore without an API key
          </figcaption>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="landing-preview-button">
                <Expand aria-hidden="true" /> Preview board
              </Button>
            </DialogTrigger>
            <DialogContent className="landing-classroom-dialog">
              <DialogTitle className="sr-only">
                Classroom preview: {current.title}
              </DialogTitle>
              <DialogDescription className="sr-only">
                An illustrative student-facing board. This preview does not
                generate or save an activity.
              </DialogDescription>
              <ExampleBoard example={current} large />
            </DialogContent>
          </Dialog>
        </div>
      </Tabs>
    </figure>
  );
}

function LandingNavigation() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuRef.current?.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  const links = (
    <>
      <a href="#how-it-works" onClick={() => setOpen(false)}>
        How it works
      </a>
      <a href="#made-for-class" onClick={() => setOpen(false)}>
        Made for class
      </a>
      <a href="#questions" onClick={() => setOpen(false)}>
        Questions
      </a>
    </>
  );
  return (
    <header className="landing-nav landing-glass">
      <div className="landing-nav-bar">
        <Link href="/" className="landing-brand" aria-label="Boardwork home">
          <BrandMark />
          <span>Boardwork</span>
        </Link>
        <nav className="landing-desktop-links" aria-label="Main navigation">
          {links}
        </nav>
        <Button asChild size="landing" className="landing-nav-cta">
          <Link href="/app">
            Open workspace <ArrowUpRight aria-hidden="true" />
          </Link>
        </Button>
        <Button
          ref={menuRef}
          variant="ghost"
          size="icon"
          className="landing-menu-trigger"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="landing-mobile-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </Button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.nav
            id="landing-mobile-navigation"
            className="landing-mobile-links"
            aria-label="Mobile navigation"
            initial={reduced ? false : { opacity: 0.8, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: reduced ? 0 : MOTION.menu, ease: EASE }}
          >
            {links}
            <Link href="/app" onClick={() => setOpen(false)}>
              Open workspace <ArrowUpRight aria-hidden="true" />
            </Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

export default function Landing() {
  const heroRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const paperY = useTransform(scrollYProgress, [0, 1], [0, 48]);
  useEffect(() => {
    const previous = document.title;
    document.title = "Boardwork — Make the first minutes matter";
    return () => {
      document.title = previous;
    };
  }, []);
  return (
    <div className="landing-page" style={motionTokens}>
      <a className="landing-skip-link" href="#landing-main">
        Skip to content
      </a>
      <LandingNavigation />
      <main id="landing-main">
        <section
          ref={heroRef}
          className="landing-hero"
          aria-labelledby="landing-title"
        >
          <motion.img
            className="landing-hero-art"
            style={{ y: reduced ? 0 : paperY }}
            src={`${import.meta.env.BASE_URL}images/landing/classroom-gradient.webp`}
            width="1536"
            height="1024"
            alt=""
            fetchPriority="high"
          />
          <div className="landing-hero-copy">
            <motion.h1
              id="landing-title"
              initial={false}
              animate={
                reduced
                  ? undefined
                  : {
                      opacity: [0.9, 1],
                      y: [16, 0],
                      filter: ["blur(2px)", "blur(0px)"],
                    }
              }
              transition={{ duration: MOTION.reveal, ease: EASE }}
            >
              Make the first
              <br />
              minutes matter.
            </motion.h1>
            <p>
              A thoughtful first task for them.
              <br />A little breathing room for you.
            </p>
            <div className="landing-hero-actions">
              <Button asChild size="landing">
                <Link href="/app">
                  Open your workspace <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <a className="landing-text-link" href="#how-it-works">
                Take a look around <ArrowDown aria-hidden="true" />
              </a>
            </div>
            <span className="landing-hero-note">
              For the everyday art of starting class.
            </span>
          </div>
          <motion.div
            className="landing-hero-demo"
            initial={false}
            animate={
              reduced
                ? undefined
                : { opacity: [0.9, 1], y: [26, 0], rotate: [-0.6, 0] }
            }
            transition={{
              duration: MOTION.hero,
              delay: MOTION.stagger,
              ease: EASE,
            }}
          >
            <BoardDemo />
          </motion.div>
        </section>

        <section
          className="landing-intro landing-container"
          aria-labelledby="intro-heading"
        >
          <Reveal>
            <h2 id="intro-heading">
              You greet the room.
              <br />
              They know where to begin.
            </h2>
            <p>
              Attendance. A question at the door. The missing pencil.
              <br className="landing-desktop-break" /> Boardwork gives students
              something worthwhile to start while you get everyone settled.
            </p>
          </Reveal>
          <ul className="landing-benefits">
            <li>
              <NotebookPen aria-hidden="true" />
              <span>Notebook-friendly tasks</span>
            </li>
            <li>
              <PencilLine aria-hidden="true" />
              <span>Always yours to edit</span>
            </li>
            <li>
              <Monitor aria-hidden="true" />
              <span>Ready for the projector</span>
            </li>
          </ul>
        </section>

        <section
          id="how-it-works"
          className="landing-feature landing-feature--context landing-container"
          aria-labelledby="context-heading"
        >
          <Reveal className="landing-context-visual">
            <div className="landing-class-note">
              <span className="landing-note-label">Your class, remembered</span>
              <h3>Grade 8 Design</h3>
              <p>
                Thoughtful makers.
                <br />
                Curious problem-solvers.
              </p>
              <dl>
                <div>
                  <dt>Current unit</dt>
                  <dd>Designing for others</dd>
                </div>
                <div>
                  <dt>Starting routine</dt>
                  <dd>Sketchbook open. Ideas welcome.</dd>
                </div>
              </dl>
            </div>
            <div className="landing-daily-note">
              <span>Today’s intention</span>
              <p>
                Compare two possibilities.
                <br />
                Choose one to test.
              </p>
              <div>
                <span>5 minutes</span>
                <span>Devices off</span>
              </div>
            </div>
            <span className="landing-visual-caption">
              Illustrative class context
            </span>
          </Reveal>
          <Reveal className="landing-feature-copy" delay={MOTION.stagger}>
            <h2 id="context-heading">
              A small prompt.{" "}
              <br />A meaningful start.
            </h2>
            <p>
              Your subject, your class, your current unit. Keep the useful
              context, add what matters today, and create an independent task
              students can actually begin.
            </p>
            <p>Review it. Change a sentence. Make it yours.</p>
            <a className="landing-text-link" href="#example-board">
              Try the example boards <ArrowUpRight aria-hidden="true" />
            </a>
          </Reveal>
        </section>

        <section
          id="made-for-class"
          className="landing-feature landing-feature--present landing-container"
          aria-labelledby="present-heading"
        >
          <Reveal className="landing-feature-copy">
            <h2 id="present-heading">
              Built for{" "}
              <br />
              the back row.
            </h2>
            <p>
              Big, clear instructions. A focused task. Space to think. Move from
              your workspace to a student-facing board without the editing
              controls.
            </p>
            <p>
              Present it in class, use the timer, or export a PNG for your
              slides.
            </p>
            <span className="landing-feature-detail">
              <Monitor aria-hidden="true" /> Students view the board. No student
              accounts.
            </span>
          </Reveal>
          <Reveal className="landing-projector-visual" delay={MOTION.stagger}>
            <div className="landing-projector-heading">
              <span>Classroom view</span>
              <span>Design · 5 min</span>
            </div>
            <ExampleBoard example={examples[1]} />
            <span className="landing-visual-caption">
              Illustrative presentation · designed to be read at a glance
            </span>
          </Reveal>
        </section>

        <section
          className="landing-library landing-container"
          aria-labelledby="library-heading"
        >
          <Reveal className="landing-section-heading">
            <h2 id="library-heading">
              Good ideas deserve
              <br />
              another class.
            </h2>
            <p>
              Save the boards that worked. Reopen, edit, favorite,
              <br className="landing-desktop-break" /> or remix them when you
              need a starting point.
            </p>
          </Reveal>
          <div className="landing-library-shelf">
            {examples.map((example, index) => (
              <Reveal
                key={example.id}
                className={`landing-saved-board landing-saved-board--${example.theme}`}
                delay={index * MOTION.stagger}
              >
                <span className="landing-saved-subject">
                  {example.className}
                </span>
                <h3>{example.title}</h3>
                <p>{example.task}</p>
                <div>
                  <span>
                    <Clock3 aria-hidden="true" /> {example.duration} min
                  </span>
                  <FolderHeart aria-hidden="true" />
                </div>
              </Reveal>
            ))}
          </div>
          <p className="landing-example-caption">
            Example boards, shown to illustrate the saved-board workflow.
          </p>
        </section>

        <section
          className="landing-key-section landing-container"
          aria-labelledby="key-heading"
        >
          <Reveal>
            <h2 id="key-heading">
              A little AI help.
              <br />A lot of teacher say.
            </h2>
          </Reveal>
          <Reveal className="landing-key-copy" delay={MOTION.stagger}>
            <p>
              Bring your own OpenAI key when you want help getting started. Keep
              editing, saving, presenting, and exporting without one.
            </p>
            <ul>
              <li>
                <Check aria-hidden="true" />
                <span>Your key stays in memory until refresh.</span>
              </li>
              <li>
                <Check aria-hidden="true" />
                <span>A quiet token-usage indicator keeps you informed.</span>
              </li>
              <li>
                <Check aria-hidden="true" />
                <span>You review the activity before students see it.</span>
              </li>
            </ul>
            <p className="landing-key-note">
              AI use is billed by OpenAI to the key you provide. The app passes
              it to OpenAI through its server for the request.
            </p>
          </Reveal>
        </section>

        <section
          id="questions"
          className="landing-faq landing-container"
          aria-labelledby="faq-heading"
        >
          <h2 id="faq-heading">
            A few things
            <br />
            you might wonder.
          </h2>
          <Accordion type="single" collapsible className="landing-faq-list">
            <AccordionItem value="students">
              <AccordionTrigger>Do students need to sign in?</AccordionTrigger>
              <AccordionContent>
                No. Boardwork is a teacher workspace. Students read the board on
                your classroom display and complete the task in their notebook,
                sketchbook, or the resource you choose.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="ai">
              <AccordionTrigger>
                Can I make a board without AI?
              </AccordionTrigger>
              <AccordionContent>
                Yes. Start with a blank board, write your own task, or edit
                something you saved. An OpenAI key is only needed for AI
                features.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="storage">
              <AccordionTrigger>
                Where are my classes and boards saved?
              </AccordionTrigger>
              <AccordionContent>
                They are saved in this installation’s database. The current app
                is one shared teacher workspace. A public installation needs
                access protection from its hosting provider; entering an AI key
                does not create a private account.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="planning">
              <AccordionTrigger>
                Is this a full lesson planner?
              </AccordionTrigger>
              <AccordionContent>
                Boardwork focuses on the first few minutes: a clear, worthwhile
                task students can begin independently. It is designed to fit
                into your teaching routine, rather than replace your lesson
                planning.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section
          className="landing-close landing-container"
          aria-labelledby="close-heading"
        >
          <Reveal>
            <h2 id="close-heading">
              A calmer start.
              <br />
              More room to teach.
            </h2>
            <p>Let the first task do a little of the heavy lifting.</p>
            <Button asChild size="landing">
              <Link href="/app">
                Open your workspace <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </Reveal>
        </section>
      </main>
      <footer className="landing-footer landing-container">
        <Link href="/" className="landing-brand">
          <BrandMark />
          <span>Boardwork</span>
        </Link>
        <p>Made for the first few minutes.</p>
        <a
          href="https://github.com/whatifqu3stion/classroom-spark"
          target="_blank"
          rel="noreferrer"
        >
          View the project <ArrowUpRight aria-hidden="true" />
        </a>
      </footer>
    </div>
  );
}
