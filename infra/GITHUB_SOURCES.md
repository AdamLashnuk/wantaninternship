# GitHub discovery source audit

Verified October 20, 2026. The hourly collector now has 36 file feeds from 17 distinct repositories: 20 tech feeds across 11 repositories and 16 engineering feeds across 10 repositories. Several repositories contribute to both tracks. Existing role relevance filters, deduplication, conditional requests, and the 14-day posting window still apply. These are scheduled discovery inputs; visitors do not fetch GitHub directly.

## Added repositories

| Repository | Track | Input |
| --- | --- | --- |
| SuryaHarikrishnan/2027-internship-tracker | Both | `master`, software, data/AI/ML, and hardware category Markdown files |
| jobright-ai/2026-Software-Engineer-Internship | Tech | `master/README.md`; verified current October postings despite the repository name |
| jobright-ai/2026-Data-Analysis-Internship | Tech | `master/README.md` |
| jobright-ai/2026-Engineer-Internship | Both | `master/README.md`; role filters separate technical software from physical engineering |
| mehek-builds/Electrical-Engineering-Internships | Engineering | `main/lists/electrical-engineering.md` |
| mehek-builds/Mechanical-Engineering-Internships | Engineering | `main/lists/mechanical-engineering.md` |
| water473/mechanical-engineering-job-posting-tracker | Engineering | `main/views/all.md`, `all-2.md`, and `all-3.md`, covering all currently published pages |
| Khushsj30/hardware-internships-2027 | Engineering | `main/README.md`; internship section only |

Jobright and Mehek currently provide aggregator application links rather than direct employer links. Preserve those destinations honestly; do not imply they are employer-direct or invent replacement URLs. Existing canonical URL and company/title deduplication handle overlaps where identities match.

## Existing sources retained or improved

- SimplifyJobs/Summer2027-Internships and vanshb03/Summer2027-Internships are already configured on `dev`; no old-cycle duplicate was added.
- speedyapply/2027-SWE-College-Jobs and speedyapply/2027-AI-College-Jobs are already configured; retain the current-cycle versions.
- sndsh404/summer-2027-internships, zshah101/Automated-List-Of-Summer-2027-and-Fall-2026-Tech-Internships, and thebargon/2027-Mechanical-Engineering-Internships remain configured.
- WonOfAKind/New-Grad-And-Internships-2027 already contributed engineering data. Use its eight internship category views (software, AI/ML, data, hardware/electrical, mechanical, aerospace, manufacturing/industrial, other engineering) instead of the oversized mixed `data/roles.json` archive. Tech coverage is new.
- hiderrick/Engineering-Internships-Summer-2027 now uses its structured `main/jobs.json` instead of parsing its README.

## Intentionally omitted

- The proposed 2026 Simplify, Vansh, and SpeedyApply variants: current-cycle equivalents are already configured.
- pratikratadiya/awesome-ml-internships: a company discovery directory, not a live posting feed.
- krishkc5/ee-internship-tracker: its inspected JSON includes expired Summer 2026 roles and Simplify-derived records whose `posted_date` is the scraper run date. Adding it would risk recycling stale roles as fresh and mostly duplicate the existing Simplify input.
- Quant, product management, unrelated business, and full-time engineering/new-grad sections are not imported into the engineering internship feed.

## Parser behavior and freshness

Markdown tables are matched by headers, supporting application links in a dedicated column, the role, or the company. Markdown formatting is removed from names and titles. Angle-bracket destinations and balanced parentheses are preserved in application URLs. Dates can be ISO, month/day, month/day/year, or relative ages; yearless month/day values use the collection year with December/January rollover handling.

For combined `Posted / First Seen` columns, publication and discovery remain separate. Water's `Checked` date and Mehek's visa column never become posting dates. Source discovery dates are retained on newly imported records and merged across duplicate feeds; subsequent collection preserves the stored first discovery date. The current freshness behavior does not promote a known listing when its source refreshes.

## Activate

From the Windows checkout:

```powershell
git pull
cd infra
sam build
sam deploy
```

The next scheduled hourly run uses the expanded inputs. To populate immediately, invoke the collector using the existing `CollectorFunctionName` stack output. No new frontend environment variables or Stripe configuration are needed.

Run `npm test` from the project root. Parser tests cover each new table layout, discovery/publication separation, header order, URLs containing parentheses, new-grad exclusions, date rollover, and deduplication freshness.
