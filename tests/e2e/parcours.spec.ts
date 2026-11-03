import { expect, test } from "@playwright/test";

/**
 * Parcours landing → calculateur → quiz → paywall, avec les API simulées
 * (ce test vérifie l'interface ; le vrai paiement se teste avec Stripe en mode test).
 */
test("de la vidéo TikTok jusqu'au paiement, les UTM suivent", async ({ page }) => {
  const tracked: string[] = [];
  await page.route("**/api/track", (r) => {
    tracked.push(JSON.parse(r.request().postData() ?? "{}").type);
    return r.fulfill({ status: 204 });
  });
  await page.route("**/api/quiz", (r) =>
    r.fulfill({ json: { quizId: "6f1c0f9e-6b1a-4c55-9a43-3f2b1b2f8f11" } }),
  );
  let checkoutBody: Record<string, unknown> = {};
  await page.route("**/api/checkout", (r) => {
    checkoutBody = JSON.parse(r.request().postData() ?? "{}");
    return r.fulfill({ json: { url: "/merci?session_id=cs_test_simule" } });
  });

  await page.goto("/?utm_source=tiktok&utm_content=video_042");
  await page.getByRole("button", { name: "Refuser" }).click();

  // Calculateur : par défaut 2 puffs × 10 € = 20 €/mois → 240 €/an
  await expect(page.getByText("240 €").first()).toBeVisible();
  // Cigarette électronique : 9 recharges × 5 € = 45 €/mois → 540 €/an
  await page.getByRole("button", { name: "Cigarette électronique" }).click();
  await page.getByRole("button", { name: "Plus" }).first().click();
  await expect(page.getByText("540 €").first()).toBeVisible();

  await page.getByRole("link", { name: /Je fais mon plan/ }).click();
  const start = page.getByRole("button", { name: /C'est parti/ });
  await expect(start).toBeDisabled(); // consentement obligatoire
  await page.getByRole("checkbox").check();
  await start.click();
  await page.getByRole("button", { name: /^Cigarette électronique/ }).click();
  await page.getByRole("button", { name: "Suivant" }).click();
  await page.getByRole("button", { name: "Suivant" }).click();
  await page.getByRole("button", { name: "1 à 2 ans" }).click();
  await page.getByRole("button", { name: "En soirée" }).click();
  await page.getByRole("button", { name: "Suivant" }).click();
  await page.getByRole("button", { name: "L'argent" }).click();
  await page.getByRole("button", { name: "Suivant" }).click();
  await page.getByRole("button", { name: "Demain" }).click();
  await page.getByRole("button", { name: /Voir mon plan/ }).click();

  await expect(page).toHaveURL(/\/plan/);
  await expect(page.getByText("4,99 € la 1re semaine, puis 14,99 € par semaine.").first()).toBeVisible();

  const pay = page.getByRole("button", { name: /Je commence pour/ });
  await page.getByPlaceholder("toi@exemple.fr").fill("test@exemple.fr");
  await expect(pay).toBeDisabled(); // cases 18+ et exécution immédiate obligatoires
  await page.getByRole("checkbox").nth(0).check();
  await page.getByRole("checkbox").nth(1).check();
  await pay.click();
  await expect(page).toHaveURL(/\/merci/);

  expect(checkoutBody).toMatchObject({ email: "test@exemple.fr", age18: true, immediateStart: true });
  expect(checkoutBody.utm).toMatchObject({ utm_source: "tiktok", utm_content: "video_042" });
  expect(tracked).toEqual(expect.arrayContaining(["visit", "calc_used", "quiz_start", "paywall_view"]));
});

test("aucun pixel publicitaire sans consentement", async ({ page }) => {
  const thirdParty: string[] = [];
  page.on("request", (r) => {
    if (/tiktok\.com|facebook\.net|facebook\.com/.test(r.url())) thirdParty.push(r.url());
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Refuser" }).click();
  await page.reload();
  await page.waitForTimeout(500);
  expect(thirdParty).toEqual([]);
});

test("l'admin n'est pas accessible sans connexion", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/connexion\?suivant=\/admin/);
});
