# Latest Drops data sources

Latest Drops is software-only. The AWS collector runs hourly; visitors read the
stored DynamoDB results through API Gateway and never initiate GitHub collection.

## Direct employer feeds

Greenhouse, Lever, and Ashby public job-board APIs are authoritative when a
listing appears in more than one source. Apply links are canonicalized to the
original employer or ATS page and safe tracking parameters are removed.

## GitHub discovery sources

| Repository | Branch | Input | Use |
| --- | --- | --- | --- |
| [speedyapply/2027-SWE-College-Jobs](https://github.com/speedyapply/2027-SWE-College-Jobs) | main | Markdown tables | Discovery and verification of original employer listings |
| [vanshb03/Summer2027-Internships](https://github.com/vanshb03/Summer2027-Internships) | dev | `.github/scripts/listings.json` | Structured discovery feed, under its repository MIT license |
| [SimplifyJobs/Summer2027-Internships](https://github.com/SimplifyJobs/Summer2027-Internships) | dev | `.github/scripts/listings.json` | Discovery and verification of original employer listings |

At the time this integration was added, no clear license file was exposed on the
specified SpeedyApply or SimplifyJobs branches. Their repositories are therefore
not mirrored or presented as copied datasets: the collector uses them to discover
factual listings, retains only normalized job facts, and links users directly to
the original employer. Source attribution remains visible in the interface.

The collector sends conditional requests with ETags/Last-Modified values, stores
cache metadata in DynamoDB, observes retry/rate-limit headers, and backs off after
GitHub or transient server failures.
