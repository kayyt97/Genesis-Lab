export function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <strong>Genesis Lab</strong>
          <span>Created by Kara Louise Tait</span>
          <span className="footer-copy">Copyright © 2026 Kara Louise Tait. All rights reserved.</span>
        </div>
        <p className="footer-disclaimer">
          Educational simulation software — not for clinical diagnosis, therapeutic decision-making, or wet-lab protocols.
          Reference data, simulated data, and uploaded data are clearly distinguished throughout the application.
        </p>
      </div>
    </footer>
  );
}
