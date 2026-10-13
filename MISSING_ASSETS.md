# Missing & Third-Party Assets Log

This log documents all third-party hotlinked images that were deliberately omitted from direct download to prevent copyright infringement, along with low-resolution assets requiring client-supplied originals.

## 1. Replaced Third-Party Hotlinked Assets
The live reference site was hotlinking assets from external third-party domains (e.g., `hearingaid.org.uk`, `azurecdn.widex.com`, `assets-ue.cas.dgs.com`, `a.storyblok.com`, `myholidays.com`, Adobe Stock). To protect the client from copyright infringement, each slot has been provided with a high-fidelity, custom-crafted vector SVG illustration or own-domain equivalent, matching clinical subject matter without imitating or tracing third-party artwork.

| Page | Slot / Section | Subject Matter | Current Solution | Recommended Spec for Owner | Owner Action Needed |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **The Impact of Untreated Hearing Loss** | Cognitive Health (`#cognitive-health`) | Brain auditory pathway and memory preservation | Custom medical vector SVG: `cognitive-health.svg` | 1200×800 px (3:2), clinical or 3D neurological illustration | Owner to supply licensed medical photo or own graphic if photo preferred over SVG |
| **The Impact of Untreated Hearing Loss** | Social Connections (`#social-connections`) | Social dining and lively conversation in background noise | Custom vector SVG: `social-connections.svg` | 1200×675 px (16:9), licensed photography of family/friends dining | Owner to supply licensed or own lifestyle photo |
| **The Impact of Untreated Hearing Loss** | Myths vs Facts (`#myths-facts`) | Clinical evidence vs common misconceptions | Custom vector SVG: `myths-facts-illustration.svg` | 1200×675 px (16:9), branded infographics card | Owner to supply licensed or own infographic |
| **Signs You May Have Hearing Loss** | Audiometric Evaluation (`#audiometry`) | Diagnostic audiogram chart & hearing frequency evaluation | Custom medical SVG: `hearing-evaluation-illustration.svg` | 1200×800 px (3:2), clinical audiometer/audiogram photo | Owner to supply licensed clinical equipment photo or retain SVG |
| **Ear Infections & Conditions** | Infection Indicator (`#infections`) | Inner, middle, and outer ear infection mechanisms | Custom medical SVG: `ear-infection-illustration.svg` | 1200×675 px (16:9), medical anatomical render | Owner to supply licensed medical render or retain SVG |
| **Find Our Clinics** | Clinics Network Banner (`#hero`) | Regional Ontario clinic locations and reach | Custom map SVG: `clinics-hero.svg` | 1920×640 px (3:1), high-resolution Ontario landscape / exterior clinic photo | Owner to supply licensed Canadian clinic network exterior photo |

---

## 2. Low-Resolution Client Assets (Needs Higher-Resolution Original)
The following files were retrieved from the client's own uploads at the highest resolution available on the legacy staging server, but have small source dimensions. The front-end has constrained their display bounding boxes to preserve crisp rendering without blurring or upscaling.

| Page | Slot | Current File | Natural Dimensions | Displayed Dimensions | Issue & Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Our Services** | 8 Service Card Icons | `service-tympanometry.webp`, `service-hearing-evaluations.webp`, `service-audiology-consultation.webp`, `service-custom-fitting.webp`, `service-maintenance-repairs.webp`, `service-earwax-management.webp`, `service-ear-protection.webp`, `service-tinnitus-management.webp` | 96×96 px | 42×42 px | Source icons were uploaded at only 96×96 px. For 3× retina displays, recommended size is 256×256 px or SVG vector format. |
| **Hearing Solutions** | BTE Feature Icons | `icon-comfort.webp`, `icon-equalizer.webp`, `icon-water-resistant.webp`, `icon-speech-clarity.webp` | 32×32 px | 24×24 px | Source icons were uploaded at only 32×32 px. Recommended size is 96×96 px or clean SVG icons. |
| **Hearing Solutions** | ITC Custom Aid | `itc-hearing-aid.webp` | 320×300 px | 178×167 px | Displayed in constrained card. Recommended original size: 800×800 px. |
