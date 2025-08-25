let recipes = [];

// Načtení receptů ze souboru
fetch("recipes.json")
  .then(res => res.json())
  .then(data => {
    recipes = data;
  })
  .catch(err => console.error("Chyba při načítání receptů:", err));

// Po načtení DOMu
document.addEventListener("DOMContentLoaded", function () {
  const button = document.getElementById("searchButton");
  const fridgeInput = document.getElementById("fridgeInput");
  const voiceButton = document.getElementById("voiceButton");

  if (button) {
    button.addEventListener("click", findRecipes);
  }

  if (fridgeInput) {
    fridgeInput.addEventListener("input", () => {
      document.getElementById("promptMessage").style.display = "none";
    });
  }

  if (voiceButton) {
    voiceButton.addEventListener("click", startVoiceInput);
  }
});

// Funkce pro hledání receptů
function findRecipes() {
  const input = document.getElementById("fridgeInput").value;
  const cleanedInput = input.replace(/\s+/g, ',');
  const inputIngredients = cleanedInput.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);

  const scoredRecipes = recipes
    .map(recipe => {
      const matched = recipe.ingredients.filter(i => inputIngredients.includes(i.toLowerCase()));
      const missing = recipe.ingredients.filter(i => !inputIngredients.includes(i.toLowerCase()));
      return {
        ...recipe,
        matchCount: matched.length,
        missing,
        total: recipe.ingredients.length
      };
    })
    .filter(r => r.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount);

  const recipeList = document.getElementById("recipeList");
  recipeList.innerHTML = "";

  if (scoredRecipes.length === 0) {
    const suggestions = ["rajče, sýr", "okurka, vejce", "rajče, salát", "vejce, máslo"];
    const random = suggestions[Math.floor(Math.random() * suggestions.length)];
    recipeList.innerHTML = `
      <div class="no-results">
        <p>😕 Žádný recept neodpovídá zadaným surovinám.</p>
        <p>Zkus přidat další suroviny. Např. <strong>${random}</strong></p>
      </div>
    `;
    return;
  }

  scoredRecipes.forEach(recipe => {
    const recipeItem = document.createElement("div");
    recipeItem.className = "recipe";

    const matchRatio = recipe.matchCount / recipe.total;
    const matchColor = matchRatio === 1
      ? "#c8f7c5"
      : matchRatio >= 0.6
      ? "#fff3c4"
      : "#f0f0f0";

    recipeItem.style.backgroundColor = matchColor;
    recipeItem.style.border = "1px solid #ccc";
    recipeItem.style.padding = "10px";
    recipeItem.style.margin = "10px";
    recipeItem.style.borderRadius = "8px";

    recipeItem.innerHTML = `
      <h3>${recipe.title}</h3>
      <button onclick="readRecipe(
  '${recipe.title.replace(/'/g, "\\'")}',
  '${recipe.steps.join(", ").replace(/'/g, "\\'")}'
)">
      <p><strong>Suroviny:</strong> ${recipe.ingredients.join(", ")}</p>
      <p><strong>Postup:</strong> ${recipe.steps.join(", ")}</p>
    `;

    recipeList.appendChild(recipeItem);
  });
}

// Funkce pro hlasový vstup
function startVoiceInput() {
  const status = document.getElementById("voiceStatus");

  if (!('webkitSpeechRecognition' in window)) {
    alert("Tvůj prohlížeč nepodporuje hlasové rozpoznávání.");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = "cs-CZ";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.start();
  status.innerHTML = "🎙️ Naslouchám... řekni suroviny.";
  status.className = "listening";

  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    document.getElementById("fridgeInput").value = transcript;
    document.getElementById("promptMessage").style.display = "none";
    findRecipes();
    status.innerHTML = "✅ Rozpoznáno: " + transcript;
    status.className = "recognized";
  };

  recognition.onerror = function(event) {
    status.innerHTML = "⚠️ Chyba: " + event.error;
    status.className = "error";
  };

  recognition.onend = function() {
    if (status.className === "listening") {
      status.innerHTML = "🛑 Naslouchání ukončeno.";
      status.className = "ended";
    }
  };
}

// Funkce pro čtení receptu
function readRecipe(name, instructions) {
  const text = `Recept: ${name}. Postup: ${instructions}`;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "cs-CZ";

  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }

  speechSynthesis.speak(utterance);
}
fetch("recipes.json")
  .then(res => res.json())
  .then(data => {
    console.log("Načtené recepty:", data); // ✅ Zkontroluj v konzoli
    recipes = data;
  })
  .catch(err => console.error("Chyba při načítání receptů:", err));
