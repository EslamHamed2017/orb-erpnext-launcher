// ORB login page: adds the intro text, language switch, footer and ORB logo around ERPNext's own
// login form. The form, its fields and its handlers are left untouched, so signing in, forgot
// password and email-link sign-in keep working exactly as before.
(() => {
  "use strict";
  if (document.body?.dataset.path !== "login") return;

  const LOGO = "/assets/orb_launcher/images/orb-logo-light.svg";
  const lang = (document.documentElement.lang || "en").toLowerCase();
  const ar = lang.startsWith("ar");
  const t = ar ? {
    h2: "بن أخضر إثيوبي، تُدار تجارته من دبي.",
    p: "اورب للتجارة العامة ش.ذ.م.م — سبع مناطق، يُشحن عبر جيبوتي إلى جدة ودبي.",
    h1: "تسجيل الدخول",
    sub: "استخدم بريد العمل الخاص بك في ORB.",
    btn: "دخول",
    forgot: "نسيت كلمة المرور؟",
    link: "أرسل لي رابط دخول على البريد",
    or: "أو",
    f1: "دبي، الإمارات العربية المتحدة",
    f2: "نظام إدارة ORB، تطوير Basetaa",
  } : {
    h2: "Ethiopian green coffee, traded from Dubai.",
    p: "ORB General Trading L.L.C — seven origins, shipped through Djibouti to Jeddah and Dubai.",
    h1: "Sign in",
    sub: "Use your ORB work email.",
    btn: "Sign in",
    forgot: "Forgot password?",
    link: "Email me a sign-in link",
    or: "or",
    f1: "Dubai, United Arab Emirates",
    f2: "ORB Management System, built by Basetaa",
  };

  const el = (tag, cls, html) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html !== undefined) node.innerHTML = html;
    return node;
  };
  const text = (tag, cls, value) => {
    const node = el(tag, cls);
    node.textContent = value;
    return node;
  };

  const langLink = (code, label) => {
    const active = ar ? code === "ar" : code === "en";
    if (active) return `<span class="is-active">${label}</span>`;
    const url = new URL(window.location.href);
    url.searchParams.set("_lang", code);
    return `<a href="${url.pathname}${url.search}${url.hash}" hreflang="${code}">${label}</a>`;
  };

  const build = () => {
    const wrapper = document.querySelector("#page-login .page-content-wrapper");
    const main = wrapper?.querySelector("main.container");
    if (!wrapper || !main || wrapper.dataset.orbLogin) return;
    wrapper.dataset.orbLogin = "1";

    const top = el("div", "orb-login-top", `${langLink("en", "English")}<span aria-hidden="true">|</span>${langLink("ar", "العربية")}`);
    top.setAttribute("aria-label", ar ? "اللغة" : "Language");
    wrapper.insertBefore(top, wrapper.firstChild);

    const intro = el("section", "orb-login-intro");
    intro.append(text("h2", "", t.h2), text("p", "", t.p));
    main.insertBefore(intro, main.firstChild);

    const foot = el("footer", "orb-login-foot");
    foot.append(text("span", "", t.f1), text("span", "", t.f2));
    wrapper.appendChild(foot);

    document.querySelectorAll("#page-login .app-logo").forEach((img) => {
      img.setAttribute("src", LOGO);
      img.setAttribute("alt", "ORB");
    });

    const login = document.querySelector("#page-login .for-login");
    const setText = (selector, value) => {
      const node = login?.querySelector(selector);
      if (node) node.textContent = value;
    };
    setText(".page-card-head h4", t.h1);
    setText(".page-card-subtitle", t.sub);
    setText('button[type="submit"]', t.btn);
    setText('a[href="#forgot"]', t.forgot);
    setText("a.btn-login-with-email-link", t.link);
    document.querySelectorAll('#page-login input[type="email"], #login_email').forEach((input) => {
      input.setAttribute("placeholder", "name@company.com");
    });

    const linkButton = login?.querySelector(".btn-login-with-email-link");
    if (linkButton && !linkButton.previousElementSibling?.classList.contains("orb-login-or")) {
      linkButton.parentElement.insertBefore(text("div", "orb-login-or", t.or), linkButton);
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build, {once: true});
  else build();
})();
