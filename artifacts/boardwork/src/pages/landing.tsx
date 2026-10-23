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
const repositoryUrl = "https://github.com/whatifqu3stion/classroom-spark";

function WorkspaceEntry({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return isPublicSite ? (
    <a href={repositoryUrl} className={className} onClick={onClick}>
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
            className="landing-product-content"
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
          <WorkspaceEntry>
            {isPublicSite ? "View project" : "Open workspace"}{" "}
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
              {isPublicSite ? "View project" : "Open workspace"}{" "}
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
              Create a purposeful first task students can begin on their own.
              <br className="landing-desktop-break" /> Keep your attention on
              arrivals, attendance, and the room.
            </p>
            <div className="landing-hero-actions">
              <Button asChild size="landing">
                <WorkspaceEntry>
                  {isPublicSite ? "View the project" : "Open your workspace"}{" "}
                  <ArrowRight aria-hidden="true" />
                </WorkspaceEntry>
              </Button>
              <a className="landing-text-link" href="#example-board">
                See it in action <ArrowDown aria-hidden="true" />
              </a>
            </div>
            <span className="landing-hero-note">
              {isPublicSite
                ? "Product preview · Explore the app screens below."
                : "Do Nows, bell-ringers, and warm-ups. One teacher workspace."}
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
              You greet the room.
              <br />
              They know where to begin.
            </h2>
            <p>
              Students are arriving. Attendance needs taking. Someone has a
              question. A visible first task gives the class a place to begin
              while you attend to the people in front of you.
            </p>
          </Reveal>
          <ul className="landing-benefits">
            <li>
              <NotebookPen aria-hidden="true" />
              <span>Tasks they can start independently</span>
            </li>
            <li>
              <PencilLine aria-hidden="true" />
              <span>Less setup between classes</span>
            </li>
            <li>
              <Monitor aria-hidden="true" />
              <span>A routine you can build on</span>
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
                Saved class. Reusable unit. Today's focus.
              </figcaption>
            </figure>
          </Reveal>
          <Reveal className="landing-feature-copy" delay={MOTION.stagger}>
            <h2 id="context-heading">
              Your class context. <br />
              Ready for the next task.
            </h2>
            <p>
              Keep your class details and reusable units ready. Add today's
              topic, choose the time available and whether students need a
              computer, then create a draft.
            </p>
            <p>
              Review and edit every word before presenting. You can also start
              with a blank board and write the task yourself.
            </p>
            <WorkspaceEntry className="landing-text-link">
              {isPublicSite ? "Get the workspace" : "Prepare a board"}{" "}
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
              A first task <br />
              they can follow.
            </h2>
            <p>
              Put the instructions, supporting prompts, and a timer on your
              classroom display. Students can see what to do and how long they
              have.
            </p>
            <p>
              Use the opening minutes to revisit prior learning, make a
              prediction, or explain an idea. Notebook-based tasks let students
              get started without opening a device.
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
          className="landing-library landing-container"
          aria-labelledby="library-heading"
        >
          <Reveal className="landing-section-heading">
            <h2 id="library-heading">
              Tomorrow has <br />a starting point.
            </h2>
            <p>
              Favorite the boards you want to revisit. Filter by class or
              subject,
              <br className="landing-desktop-break" /> then reopen, edit, or
              duplicate a task for another lesson.
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
              Your judgment.
              <br />
              Your final say.
            </h2>
          </Reveal>
          <Reveal className="landing-key-copy" delay={MOTION.stagger}>
            <p>
              Use your own OpenAI key for help drafting an activity, or start
              with a blank board. Editing, saving, presenting, and exporting
              work without a key.
            </p>
            <ul>
              <li>
                <Check aria-hidden="true" />
                <span>Your key stays in memory until refresh.</span>
              </li>
              <li>
                <Check aria-hidden="true" />
                <span>See token use for this visit beneath Create board.</span>
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
            {isPublicSite && (
              <AccordionItem value="preview">
                <AccordionTrigger>
                  Can I use the workspace on this site?
                </AccordionTrigger>
                <AccordionContent>
                  This site is a product tour with sample classroom content.
                  The linked GitHub project includes instructions for running
                  your own workspace with saving and optional AI drafting.
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
                They are saved in your workspace installation’s database. The current app
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
              A clearer start.
              <br />
              More room to teach.
            </h2>
            <p>
              Give students a place to begin, and yourself room to welcome them.
            </p>
            <Button asChild size="landing">
              <WorkspaceEntry>
                {isPublicSite ? "View the project" : "Open your workspace"}{" "}
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
