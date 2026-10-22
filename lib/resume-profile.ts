export function cleanResumeText(value: string) {
  const text = value.replace(/\u0000/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{4,}/g, '\n\n').trim();
  if (text.length < 50) throw new Error('There is not enough readable text in this file. Scanned PDFs need OCR; upload a text-based PDF or DOCX, or paste your resume below.');
  if (text.length > 30000) throw new Error('Keep resume text under 30,000 characters.');
  return text;
}
export const resumeSkillOptions = ['Python','Java','JavaScript','TypeScript','C++','C#','SQL','R','Go','Rust','React','Next.js','Node.js','HTML','CSS','AWS','Azure','GCP','Docker','Kubernetes','Git','Linux','TensorFlow','PyTorch','scikit-learn','pandas','NumPy','Spark','Tableau','Power BI','PostgreSQL','MongoDB','Redis','GraphQL','REST','Flask','Django','Spring','MATLAB','SolidWorks','AutoCAD','CATIA','Simulink','Verilog','VHDL','FPGA','PCB','CAD','Figma'];
export function resumeSkills(text: string) { return resumeSkillOptions.filter(skill => new RegExp(`(^|[^a-z0-9])${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9])`, 'i').test(text)); }
