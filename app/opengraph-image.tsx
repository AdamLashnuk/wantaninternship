import { ImageResponse } from "next/og";
export const alt = "WantAnInternship — Software and engineering internships";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(<div style={{ width:"100%",height:"100%",display:"flex",flexDirection:"column",justifyContent:"center",padding:80,background:"#081426",color:"#eff6ff",fontFamily:"sans-serif" }}><div style={{fontSize:32,color:"#73b5ff",marginBottom:44}}>WantAnInternship</div><div style={{display:"flex",flexDirection:"column",fontSize:70,fontWeight:700,lineHeight:1.1}}><span>Catch the opening</span><span>while it’s fresh.</span></div><div style={{fontSize:28,color:"#a9b9d1",marginTop:32}}>Software & engineering internships.</div></div>, size);
}
