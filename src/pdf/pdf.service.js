import puppeteer from "puppeteer";
import chromium from "@sparticuz/chromium";

export const generatePDF = async (html) => {
    let browser;
    
    try {
        const executablePath = await chromium.executablePath();
        
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: executablePath || undefined, // Fallback to puppeteers bundled chromium
            headless: chromium.headless,
        });
    } catch (err) {
        console.warn("Chromium path failed, trying default puppeteer launch:", err.message);
        browser = await puppeteer.launch({
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
    }

    const page = await browser.newPage();

    await page.setContent(html, {
        waitUntil: "networkidle0",
    });

    const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
    });

    await browser.close();

    return pdf;
};