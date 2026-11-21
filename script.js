import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/*
  SweetDate Supabase settings
  Replace these two values with your own Supabase Project URL and Publishable key.
  Never put a Secret key or database password in this file.
*/
const SUPABASE_URL = "https://xbudimnnalrrbwkpxepn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_2VOT-My3MJfBgKlbD9Preg_g7Fad_TO";
const ADMIN_EMAIL = "irenetan050904@gmail.com";

const supabaseConfigured =
    SUPABASE_URL.startsWith("https://") &&
    !SUPABASE_URL.includes("PASTE_") &&
    SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_") &&
    !SUPABASE_PUBLISHABLE_KEY.includes("PASTE_");

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

const noButton = document.getElementById("noButton");
let selectedPlaces = [];
let currentStep = 1;

// Custom modal
function showModal(title, message, icon = "💜", onConfirm = null, confirmMode = false) {
    const modal = document.getElementById("customModal");
    document.getElementById("modalTitle").textContent = title;
    document.getElementById("modalMessage").textContent = message;
    document.getElementById("modalIcon").textContent = icon;

    const cancelBtn = document.getElementById("modalCancel");
    const confirmBtn = document.getElementById("modalConfirm");
    cancelBtn.style.display = confirmMode ? "block" : "none";
    confirmBtn.textContent = confirmMode ? "确定 💗" : "好的 💗";
    modal.classList.add("show");

    confirmBtn.onclick = () => {
        modal.classList.remove("show");
        if (onConfirm) onConfirm();
    };
    cancelBtn.onclick = () => modal.classList.remove("show");
}
function showNotice(message, title = "温馨提示", icon = "💜") {
    showModal(title, message, icon);
}
function showConfirm(message, callback) {
    showModal("确定要这样做吗？", message, "🥺", callback, true);
}

// Escape the "不要" button on desktop and mobile
function moveButton() {
    const padding = 15;
    const maxX = Math.max(padding, window.innerWidth - noButton.offsetWidth - padding);
    const maxY = Math.max(padding, window.innerHeight - noButton.offsetHeight - padding);
    const x = padding + Math.random() * Math.max(0, maxX - padding);
    const y = padding + Math.random() * Math.max(0, maxY - padding);
    noButton.style.position = "fixed";
    noButton.style.left = `${x}px`;
    noButton.style.top = `${y}px`;
}
noButton.addEventListener("mouseenter", moveButton);
noButton.addEventListener("touchstart", event => {
    event.preventDefault();
    moveButton();
}, { passive: false });
noButton.addEventListener("click", moveButton);

// Page navigation
function showPage(pageId) {
    document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
    document.getElementById(pageId).classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
}
function acceptDate() {
    currentStep = 1;
    updateStep();
    showPage("application");
}

// Multiple activity selection
document.querySelectorAll(".place").forEach(button => {
    button.addEventListener("click", function () {
        const place = this.dataset.place;
        if (selectedPlaces.includes(place)) {
            selectedPlaces = selectedPlaces.filter(item => item !== place);
            this.classList.remove("selected");
            this.setAttribute("aria-pressed", "false");
        } else {
            selectedPlaces.push(place);
            this.classList.add("selected");
            this.setAttribute("aria-pressed", "true");
        }
        updateSelectedPlaces();
    });
});

function getCustomPlaces() {
    return document.getElementById("customPlace").value
        .split(/[,，、]/).map(item => item.trim()).filter(Boolean);
}
function getAllPlaces() {
    return [...new Set([...selectedPlaces, ...getCustomPlaces()])];
}
function updateSelectedPlaces() {
    const allPlaces = getAllPlaces();
    document.getElementById("selectedPlaces").textContent =
        allPlaces.length ? allPlaces.join("、") : "还没有选择活动";
}
document.getElementById("customPlace").addEventListener("input", updateSelectedPlaces);

// Form steps
function updateStep() {
    document.querySelectorAll(".form-step").forEach(step => step.classList.remove("active-step"));
    document.getElementById(`step${currentStep}`).classList.add("active-step");
    document.getElementById("progressBar").style.width = `${currentStep * 25}%`;
    document.getElementById("stepText").textContent = `STEP 0${currentStep} / 04`;
    window.scrollTo({ top: 0, behavior: "smooth" });
}
function nextStep(step) {
    if (step === 1) {
        const date = document.getElementById("date").value;
        if (!date) return showNotice("还没有选择约会日期哦！", "日期提醒", "🌷");
        const chosenDate = new Date(`${date}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (chosenDate < today) return showNotice("请选择今天或之后的日期哦！", "日期不正确", "📅");
    }
    if (step === 2 && !document.getElementById("time").value) {
        return showNotice("记得选择我们见面的时间哦！", "时间提醒", "🕰️");
    }
    if (step === 3) {
        if (getAllPlaces().length === 0) {
            return showNotice("至少选择一个想去的地方哦！", "还没选择活动", "📍");
        }
        updatePreview();
    }
    currentStep = step + 1;
    updateStep();
}
function prevStep(step) {
    currentStep = step - 1;
    updateStep();
}

// Form data and safe preview rendering
function getFormData() {
    return {
        date: document.getElementById("date").value,
        time: document.getElementById("time").value,
        places: getAllPlaces(),
        message: document.getElementById("message").value.trim()
    };
}
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[char]);
}
function detailsHTML(data) {
    return `
        <strong>💜 约会资料确认</strong><br>
        📅 日期：${escapeHTML(data.date)}<br>
        🕒 时间：${escapeHTML(data.time)}<br>
        📍 约会活动：<br>
        ${data.places.map(place => "♡ " + escapeHTML(place)).join("<br>")}<br>
        💌 留言：${escapeHTML(data.message || "没有留言")}
    `;
}
function updatePreview() {
    document.getElementById("preview").innerHTML = detailsHTML(getFormData());
}

// Submit to Supabase (not localStorage)
async function submitDate() {
    if (!supabase) {
        return showNotice(
            "网站还没有设置 Supabase 连接资料。\n请先在 script.js 填入 Project URL 和 Publishable Key。",
            "尚未连接云端数据库",
            "🔧"
        );
    }

    const data = getFormData();
    if (!data.date || !data.time || data.places.length === 0) {
        return showNotice("请检查日期、时间和约会活动是否填写完整。", "资料不完整", "🌷");
    }

    const submitButton = document.getElementById("submitButton");
    submitButton.disabled = true;
    submitButton.textContent = "正在送出申请...";

    try {
        const { error } = await supabase
            .from("date_applications")
            .insert([{
                date: data.date,
                time: data.time,
                places: data.places,
                message: data.message
            }]);

        if (error) throw error;

        document.getElementById("successDetails").innerHTML = detailsHTML(data);
        showPage("success");
        document.getElementById("date").value = "";
        document.getElementById("time").value = "";
        document.getElementById("customPlace").value = "";
        document.getElementById("message").value = "";
        selectedPlaces = [];
        document.querySelectorAll(".place").forEach(button => {
            button.classList.remove("selected");
            button.setAttribute("aria-pressed", "false");
        });
        updateSelectedPlaces();
        currentStep = 1;
        updateStep();
    } catch (error) {
        console.error("SweetDate submit error:", error);
        showNotice(
            `申请暂时无法送出：${error.message || "连接失败"}\n请检查网络或 Supabase 数据表及权限设置。`,
            "提交失败",
            "🥺"
        );
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "提交我的约会申请 💜";
    }
}

// Admin authentication and cloud records
function showAdminLogin() {
    document.getElementById("adminLogin").hidden = false;
    document.getElementById("adminPanel").hidden = true;
}
function showAdminPanel(email) {
    document.getElementById("adminLogin").hidden = true;
    document.getElementById("adminPanel").hidden = false;
    document.getElementById("adminWelcome").textContent = `已登入：${email}`;
}
async function adminLogin() {
    if (!supabase) {
        return showNotice("请先在 script.js 填入 Supabase Project URL 和 Publishable Key。", "尚未连接云端数据库", "🔧");
    }
    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value;
    const button = document.getElementById("loginButton");

    if (!email || !password) return showNotice("请填写管理员 Email 和密码。", "登入资料不完整", "🔐");
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        return showNotice("这个 Email 不是设定的管理员账号。", "无法登入", "🔒");
    }

    button.disabled = true;
    button.textContent = "正在登入...";
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        showAdminPanel(data.user.email);
        document.getElementById("adminPassword").value = "";
        await loadAdmin();
    } catch (error) {
        console.error("SweetDate admin login error:", error);
        showNotice(error.message || "登入失败，请检查 Email 和密码。", "登入失败", "🥺");
    } finally {
        button.disabled = false;
        button.textContent = "登入管理员后台";
    }
}

async function adminLogout() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
        showNotice(error.message, "登出失败", "🥺");
        return;
    }
    showAdminLogin();
    document.getElementById("adminContent").innerHTML = "";
    showNotice("你已经安全登出。", "登出成功", "💜");
}

async function loadAdmin() {
    const content = document.getElementById("adminContent");
    if (!supabase) {
        content.innerHTML = "<p>请先设置 Supabase 连接资料。</p>";
        return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        showAdminLogin();
        return;
    }
    showAdminPanel(user.email);
    content.innerHTML = "<p>正在读取云端申请...</p>";

    try {
        const { data, error } = await supabase
            .from("date_applications")
            .select("id,date,time,places,message,submitted_at")
            .order("submitted_at", { ascending: false });
        if (error) throw error;

        if (!data || data.length === 0) {
            content.innerHTML = "<p>目前还没有收到约会申请 💜</p>";
            return;
        }

        content.innerHTML = `
            <h2>收到 ${data.length} 份约会申请 💗</h2>
            ${data.map(app => `
                <div class="admin-item">
                    <strong>💌 约会申请</strong><br>
                    📅 日期：${escapeHTML(app.date)}<br>
                    🕒 时间：${escapeHTML(app.time)}<br>
                    📍 约会活动：<br>
                    ${(app.places || []).map(place => "♡ " + escapeHTML(place)).join("<br>")}<br>
                    💬 留言：${escapeHTML(app.message || "没有留言")}<br>
                    <small>提交时间：${escapeHTML(new Date(app.submitted_at).toLocaleString("zh-CN"))}</small><br>
                    <button class="delete-btn" data-delete-id="${escapeHTML(app.id)}">删除记录</button>
                </div>
            `).join("")}
        `;

        content.querySelectorAll("[data-delete-id]").forEach(button => {
            button.addEventListener("click", () => deleteApplication(button.dataset.deleteId));
        });
    } catch (error) {
        console.error("SweetDate admin load error:", error);
        content.innerHTML = `<p>读取失败：${escapeHTML(error.message || "未知错误")}</p>`;
    }
}

function deleteApplication(id) {
    showConfirm("确定删除这份约会申请吗？删除后会从云端数据库移除。", async () => {
        try {
            const { error } = await supabase
                .from("date_applications")
                .delete()
                .eq("id", id);
            if (error) throw error;
            await loadAdmin();
            showNotice("约会申请已经从云端删除。", "删除成功", "🗑️");
        } catch (error) {
            console.error("SweetDate delete error:", error);
            showNotice(error.message || "删除失败，请稍后再试。", "删除失败", "🥺");
        }
    });
}

// If ?admin=1 is in the URL, open the admin login screen.
// Database RLS still checks the authenticated admin email.
async function initializeAdminRoute() {
    if (!window.location.search.includes("admin=1")) return;
    showPage("admin");
    if (!supabase) {
        showAdminLogin();
        return;
    }
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        showAdminPanel(user.email);
        await loadAdmin();
    } else {
        showAdminLogin();
    }
}

// Expose functions used by the original inline HTML onclick handlers.
Object.assign(window, {
    showPage, acceptDate, nextStep, prevStep, submitDate,
    adminLogin, adminLogout, loadAdmin
});

initializeAdminRoute();
