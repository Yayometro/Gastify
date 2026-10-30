export default function GastifyPwaArtwork({ size }: { size: number }) {
  const markSize = Math.round(size * 0.49);
  const line = Math.max(5, Math.round(size * 0.035));
  return <div style={{
    position: "relative",
    display: "flex",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: `${Math.round(size * 0.23)}px`,
    background: "linear-gradient(145deg, #503a79 0%, #211737 58%, #12101f 100%)",
  }}>
    <div style={{
      display: "flex",
      width: `${Math.round(size * 0.54)}px`,
      height: `${Math.round(size * 0.54)}px`,
      alignItems: "center",
      justifyContent: "center",
      marginTop: `-${Math.round(size * 0.12)}px`,
      borderRadius: "50%",
      background: "#f7f2ff",
      color: "#211737",
      fontSize: `${markSize}px`,
      fontWeight: 800,
      letterSpacing: `-${Math.round(size * 0.04)}px`,
    }}>G</div>
    <div style={{
      position: "absolute",
      left: "19%",
      bottom: "20%",
      width: "61%",
      height: "21%",
      borderBottom: `${line}px solid #f7f2ff`,
      borderRadius: "0 0 50% 50%",
      transform: "rotate(-1deg)",
    }} />
    <div style={{
      position: "absolute",
      right: "18%",
      bottom: "23%",
      width: `${Math.round(size * 0.075)}px`,
      height: `${Math.round(size * 0.075)}px`,
      borderTop: `${line}px solid #f7f2ff`,
      borderRight: `${line}px solid #f7f2ff`,
      borderRadius: "2px",
      transform: "rotate(45deg)",
    }} />
  </div>;
}
