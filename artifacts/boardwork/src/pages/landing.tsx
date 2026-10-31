import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Link } from "wouter";
import {
  getWorkspaceEntry,
  repositoryUrl,
  workspaceSetupUrl,
} from "@/lib/workspace-entry";
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
  Expand,
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
const isPublicSite = import.meta.env.VITE_PUBLIC_SITE === "true";
const workspaceEntry = getWorkspaceEntry(
  isPublicSite,
  import.meta.env.VITE_WORKSPACE_URL,
);

function WorkspaceEntry({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return workspaceEntry.external ? (
    <a href={workspaceEntry.href} className={className} onClick={onClick}>
      {children}
    </a>
  ) : (
    <Link href="/app" className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

const motionTokens = {
  "--landing-motion-fast": `${MOTION.fast}s`,
  "--landing-motion-menu": `${MOTION.menu}s`,
  "--landing-motion-example": `${MOTION.example}s`,
  "--landing-ease": `cubic-bezier(${EASE.join(",")})`,
} as CSSProperties;

const productImages = {
  homebase: {
    file: "homebase.png",
    width: 2160,
    height: 1500,
    label: "Homebase",
    alt: "Boardwork Homebase with an editable student task, visual focus timer, daily agenda, and classroom clock.",
  },
  workspace: {
    file: "workspace.webp",
    mobile: "workspace-mobile.webp",
    width: 2560,
    height: 1920,
    mobileWidth: 716,
    mobileHeight: 1378,
    label: "Workspace",
    alt: "Boardwork editor with the osmosis task, editable reasoning prompts, notebook materials, save status, and the Present Screen action.",
  },
  setup: {
    file: "setup.webp",
    width: 800,
    height: 1712,
    label: "Class setup",
    alt: "Actual setup controls: Grade 6 Science, an osmosis topic, the Cells & systems unit, No computer selected, and Create board or Start blank actions.",
  },
  present: {
    file: "present.webp",
    mobile: "present-mobile.webp",
    width: 2560,
    height: 1600,
    mobileWidth: 780,
    mobileHeight: 1688,
    label: "Classroom view",
    alt: "The same osmosis activity in the student-facing presentation: large instructions, two reasoning prompts, notebook materials, and a seven-minute timer.",
  },
  history: {
    file: "history.webp",
    mobile: "history-mobile.webp",
    width: 2560,
    height: 1600,
    mobileWidth: 780,
    mobileHeight: 1688,
    label: "Saved boards",
    alt: "Boardwork History with class and subject filters, favorite activities, and saved Science, Design, and Language tasks ready to reopen or present.",
  },
} as const;
type ProductImage = (typeof productImages)[keyof typeof productImages];
const productViews = [
  {
    id: "prepare",
    label: "Prepare",
    image: productImages.workspace,
    description: "Add today's focus. Review and edit the task before class.",
  },
  {
    id: "present",
    label: "Present",
    image: productImages.present,
    description:
      "Give students a clear task, reasoning prompts, and time to work.",
  },
  {
    id: "reuse",
    label: "Reuse",
    image: productImages.history,
    description:
      "Find a saved board by class or subject. Adapt it for the next lesson.",
  },
  {
    id: "homebase",
    label: "Homebase",
    image: productImages.homebase,
    description:
      "Keep the task, timer, agenda, and classroom tools on one reusable board.",
  },
] as const;
const productImagePath = (file: string) =>
  `${import.meta.env.BASE_URL}images/landing/product/${file}`;

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

function ProductPicture({
  image,
  eager = false,
}: {
  image: ProductImage;
  eager?: boolean;
}) {
  return (
    <picture className="landing-product-picture">
      {"mobile" in image && (
        <source
          media="(max-width: 40rem)"
          srcSet={productImagePath(image.mobile)}
          width={image.mobileWidth}
          height={image.mobileHeight}
        />
      )}
      <img
        src={productImagePath(image.file)}
        width={image.width}
        height={image.height}
        alt={image.alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
      />
    </picture>
  );
}

function ScreenshotPreview({
  image,
  eager = false,
}: {
  image: ProductImage;
  eager?: boolean;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="landing-shot-trigger"
          aria-label={`Enlarge ${image.label.toLowerCase()} screenshot`}
        >
          <ProductPicture image={image} eager={eager} />
          <span className="landing-shot-expand">
            <Expand aria-hidden="true" /> Enlarge
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="landing-classroom-dialog landing-screenshot-dialog">
        <DialogTitle>{image.label} in Boardwork</DialogTitle>
        <DialogDescription>
          Actual app with sample classroom content. Scroll to explore the
          full-size screenshot.
        </DialogDescription>
        <div
          className="landing-screenshot-scroll"
          tabIndex={0}
          role="region"
          aria-label={`${image.label} full-size screenshot`}
        >
          <img
            src={productImagePath(image.file)}
            width={image.width}
            height={image.height}
            alt={image.alt}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProductDemo() {
  const [view, setView] = useState("prepare");
  const reduced = useReducedMotion();
  const current =
    productViews.find((item) => item.id === view) ?? productViews[0];
  return (
    <figure className="landing-demo landing-glass" id="example-board">
      <Tabs value={view} onValueChange={setView}>
        <div className="landing-demo-toolbar">
          <span className="landing-demo-brand">Inside Boardwork</span>
          <TabsList aria-label="Product views" className="landing-view-tabs">
            {productViews.map((item) => (
              <TabsTrigger key={item.id} value={item.id}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {productViews.map((item) => (
          <TabsContent
            key={item.id}
            value={item.id}
            className={`landing-product-content${item.id === "homebase" ? " landing-product-content--homebase" : ""}`}
          >
            <motion.div
              initial={reduced ? false : { opacity: 0.65 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: reduced ? 0 : MOTION.example,
                ease: EASE,
              }}
            >
              <ScreenshotPreview
                image={item.image}
                eager={item.id === "prepare"}
              />
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
      <figcaption className="landing-demo-footer">
        <span>{current.description}</span>
        <span>Actual app · sample classroom content</span>
      </figcaption>
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
        Plan a task
      </a>
      <a href="#homebase" onClick={() => setOpen(false)}>
        Classroom tools
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
          <WorkspaceEntry>
            {workspaceEntry.available ? "Open workspace" : "See setup options"}{" "}
            <ArrowUpRight aria-hidden="true" />
          </WorkspaceEntry>
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
            <WorkspaceEntry onClick={() => setOpen(false)}>
              {workspaceEntry.available ? "Open workspace" : "See setup options"}{" "}
              <ArrowUpRight aria-hidden="true" />
            </WorkspaceEntry>
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
    document.title = "Boardwork — Less juggling. More teaching.";
    return () => {
      document.title = previous;
    };
  }, []);
  return (
    <div
      className={`landing-page${isPublicSite ? " landing-page--public" : ""}`}
      style={motionTokens}
    >
      <a className="landing-skip-link" href="#landing-main">
        Skip to content
      </a>
      {isPublicSite && (
        <aside className="landing-demo-banner" aria-label="About this demo">
          <p>
            <strong>Explore Boardwork</strong>
            <span>
              {workspaceEntry.available
                ? "Take a look, then open your classroom workspace."
                : "A screenshot tour. The hosted workspace is not available yet."}
            </span>
          </p>
          <a
            href={
              workspaceEntry.available ? workspaceEntry.href : workspaceSetupUrl
            }
          >
            {workspaceEntry.available ? "Open workspace" : "See setup options"}{" "}
            <ArrowUpRight aria-hidden="true" />
          </a>
        </aside>
      )}
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
              Less juggling.
              <br />
              More teaching.
            </motion.h1>
            <p>
              Give your class a clear task, a visible timer, and a plan to follow.
              Prepare activities and keep everyday classroom tools together,
              so you can focus on the people in the room.
            </p>
            <div className="landing-hero-actions">
              <Button asChild size="landing">
                {workspaceEntry.available ? (
                  <WorkspaceEntry>
                    Open your workspace <ArrowRight aria-hidden="true" />
                  </WorkspaceEntry>
                ) : (
                  <a href="#example-board">
                    Explore Boardwork <ArrowRight aria-hidden="true" />
                  </a>
                )}
              </Button>
              <a className="landing-text-link" href="#homebase">
                Explore the classroom tools <ArrowDown aria-hidden="true" />
              </a>
            </div>
            <span className="landing-hero-note">
              {isPublicSite
                ? "Real app screens with sample classroom content."
                : "Activities, classroom tools, and saved routines in one place."}
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
            <ProductDemo />
          </motion.div>
        </section>

        <section
          className="landing-intro landing-container"
          aria-labelledby="intro-heading"
        >
          <Reveal>
            <h2 id="intro-heading">
              “What are we doing?”
              <br />
              Put the answer on the board.
            </h2>
            <p>
              The bell rings. You’re taking attendance, finding a resource, and
              answering the same question again. Boardwork gives students a
              shared place to look for the task, the time, and what comes next.
            </p>
          </Reveal>
          <ul className="landing-benefits">
            <li>
              <NotebookPen aria-hidden="true" />
              <span>Give students a clear starting point</span>
            </li>
            <li>
              <PencilLine aria-hidden="true" />
              <span>Keep your classroom tools together</span>
            </li>
            <li>
              <Monitor aria-hidden="true" />
              <span>Reuse what worked last time</span>
            </li>
          </ul>
        </section>

        <section
          id="how-it-works"
          className="landing-feature landing-feature--context landing-container"
          aria-labelledby="context-heading"
        >
          <Reveal className="landing-setup-visual">
            <figure className="landing-product-figure landing-product-figure--setup">
              <ScreenshotPreview image={productImages.setup} />
              <figcaption>
                Choose your class, add today’s topic, and make the task your own.
              </figcaption>
            </figure>
          </Reveal>
          <Reveal className="landing-feature-copy" delay={MOTION.stagger}>
            <h2 id="context-heading">
              A fresh task. <br />
              Without starting from scratch.
            </h2>
            <p>
              Keep each class’s subject, routines, and current unit ready for
              next time. Add today’s topic and choose how long students have,
              with or without devices.
            </p>
            <p>
              Write your own warm-up or ask AI for a first draft. Edit the
              wording, add an image, and adjust the prompts until the activity
              fits your students. You decide what reaches the screen.
            </p>
            <WorkspaceEntry className="landing-text-link">
              {workspaceEntry.available ? "Prepare a board" : "See setup options"}{" "}
              <ArrowRight aria-hidden="true" />
            </WorkspaceEntry>
          </Reveal>
        </section>

        <section
          id="made-for-class"
          className="landing-feature landing-feature--present landing-container"
          aria-labelledby="present-heading"
        >
          <Reveal className="landing-feature-copy">
            <h2 id="present-heading">
              Keep the instructions visible. <br />
              Keep everyone moving.
            </h2>
            <p>
              “What do I need?” “How long have we got?” Show the task,
              supporting prompts, materials, and timer together on your
              classroom display. Students can check back as they work.
            </p>
            <p>
              Switch to a clean presentation view when you’re ready. Students
              work in a notebook, sketchbook, or the resource you choose;
              they don’t need a Boardwork account.
            </p>
            <span className="landing-feature-detail">
              <Monitor aria-hidden="true" /> Present in class or export a PNG
              for your slides.
            </span>
          </Reveal>
          <Reveal className="landing-projector-visual" delay={MOTION.stagger}>
            <figure className="landing-product-figure">
              <ScreenshotPreview image={productImages.present} />
              <figcaption>
                The same activity, ready for the classroom display.
              </figcaption>
            </figure>
          </Reveal>
        </section>

        <section
          id="homebase"
          className="landing-feature landing-feature--homebase landing-container"
          aria-labelledby="homebase-heading"
        >
          <Reveal className="landing-feature-copy">
            <h2 id="homebase-heading">
              Your timer. Your agenda. <br />
              One place to look.
            </h2>
            <p>
              Keep the lesson moving without switching between a timer,
              a list of instructions, and a handful of open tabs. Homebase
              brings your classroom tools onto one board you can arrange and save.
            </p>
            <p>
              Set up a board for arrivals, independent work, or the next class.
              Add what you need, arrange it to suit the room, and present it
              without the editing controls.
            </p>
          </Reveal>
          <Reveal className="landing-projector-visual" delay={MOTION.stagger}>
            <figure className="landing-product-figure">
              <ScreenshotPreview image={productImages.homebase} />
              <figcaption>A task, focus timer, agenda, and clock on one saved Homebase.</figcaption>
            </figure>
          </Reveal>
          <dl className="landing-tool-outcomes">
            <div>
              <dt>Make time visible</dt>
              <dd>Countdown timers, a stopwatch, and a clock help the class follow the pace.</dd>
            </div>
            <div>
              <dt>Bring everyone into the activity</dt>
              <dd>Pick names without repeats, make random groups, or roll dice for a prompt.</dd>
            </div>
            <div>
              <dt>Show what happens next</dt>
              <dd>Check off an agenda, leave a note, or display a work mode and traffic signal.</dd>
            </div>
            <div>
              <dt>Keep resources within reach</dt>
              <dd>Add links, images, and supported videos or documents beside the task.</dd>
            </div>
          </dl>
        </section>

        <section
          className="landing-library landing-container"
          aria-labelledby="library-heading"
        >
          <Reveal className="landing-section-heading">
            <h2 id="library-heading">
              That worked well. <br />Keep it for next time.
            </h2>
            <p>
              Star the activities worth keeping. Find them by class or subject,
              then reopen or duplicate one and adapt it for your next group.
              Your good ideas stay easy to find.
            </p>
          </Reveal>
          <Reveal className="landing-library-product">
            <figure className="landing-product-figure">
              <ScreenshotPreview image={productImages.history} />
              <figcaption>
                History in the app · sample Science, Design, and Language
                activities.
              </figcaption>
            </figure>
          </Reveal>
        </section>

        <section
          className="landing-key-section landing-container"
          aria-labelledby="key-heading"
        >
          <Reveal>
            <h2 id="key-heading">
              Keep the context.
              <br />
              Skip the retyping.
            </h2>
          </Reveal>
          <Reveal className="landing-key-copy" delay={MOTION.stagger}>
            <p>
              Your teaching approach shouldn’t need explaining every time you
              prepare a task. Save reusable guidance, unit details, and learning
              goals to bring them into your next activity.
            </p>
            <ul>
              <li>
                <Check aria-hidden="true" />
                <span>Keep class routines and unit details close at hand.</span>
              </li>
              <li>
                <Check aria-hidden="true" />
                <span>Reuse your teaching strategies and activity guidance.</span>
              </li>
              <li>
                <Check aria-hidden="true" />
                <span>Review curriculum excerpts and choose the objectives to use.</span>
              </li>
            </ul>
            <p className="landing-key-note">
              Curriculum tools are available in a protected workspace. You
              approve the material before it guides AI drafts, and review the
              resulting task before presenting.
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
            {isPublicSite && (
              <AccordionItem value="preview">
                <AccordionTrigger>
                  Can I use the workspace on this site?
                </AccordionTrigger>
                <AccordionContent>
                  {workspaceEntry.available
                    ? "Yes. Use Open workspace to go to the app. The screens on this page are examples, so you can explore before you begin."
                    : "Not yet. This page lets you explore the app through screenshots. A hosted workspace is still being prepared. Setup options are available if you want to run your own."}
                </AccordionContent>
              </AccordionItem>
            )}
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
                Yes. Write a task from scratch, adapt a saved activity, or build
                a Homebase with timers, agendas, and classroom tools. Editing,
                saving, presenting, and PNG export work without AI.
                An OpenAI key is only needed for AI features.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="ai-cost">
              <AccordionTrigger>What do I need for AI drafting?</AccordionTrigger>
              <AccordionContent>
                An OpenAI API key with billing enabled. Add it in AI settings
                when you want help drafting; OpenAI bills that usage separately.
                The key lasts for your current visit and is cleared on refresh.
                You can use the rest of Boardwork without one.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="homebase">
              <AccordionTrigger>Will my classroom board be there next time?</AccordionTrigger>
              <AccordionContent>
                Yes. Homebase saves your tools, layout, and content, and you can
                keep several boards for a class. Timers, stopwatch progress,
                name picks, and generated groups start fresh when you reopen a
                board. Your agenda checks, drawings, scores, and recorded votes
                are saved.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="storage">
              <AccordionTrigger>
                Is my workspace private?
              </AccordionTrigger>
              <AccordionContent>
                The current app is a shared teacher workspace, without separate
                teacher accounts. Whoever sets it up needs to restrict access
                before you add private teaching materials. An AI key does not
                provide sign-in or make a workspace private. See the{" "}
                <a href={workspaceSetupUrl} className="landing-text-link">
                  workspace setup guide
                </a>{" "}
                for details.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="planning">
              <AccordionTrigger>
                Is this a full lesson planner?
              </AccordionTrigger>
              <AccordionContent>
                Boardwork helps you prepare short activities and run everyday
                classroom routines. Homebase keeps your task, agenda, resources,
                and classroom tools together throughout a lesson. It does not
                collect student assignments, mark work, or replace your lesson
                planner.
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
              Your next class.
              <br />
              A little more together.
            </h2>
            <p>
              A task they can follow. Tools you can reach. Good ideas ready to use again.
            </p>
            <Button asChild size="landing">
              <WorkspaceEntry>
                {workspaceEntry.available
                  ? "Open your workspace"
                  : "See setup options"}{" "}
                <ArrowRight aria-hidden="true" />
              </WorkspaceEntry>
            </Button>
          </Reveal>
        </section>
      </main>
      <footer className="landing-footer landing-container">
        <Link href="/" className="landing-brand">
          <BrandMark />
          <span>Boardwork</span>
        </Link>
        <p>For the everyday work of teaching.</p>
        <a href={repositoryUrl} target="_blank" rel="noreferrer">
          View the project <ArrowUpRight aria-hidden="true" />
        </a>
      </footer>
    </div>
  );
}
