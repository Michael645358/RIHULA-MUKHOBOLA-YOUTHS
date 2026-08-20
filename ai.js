async function askAI() {

    const input = document.getElementById("aiInput");
    const messages = document.getElementById("aiMessages");

    const question = input.value.trim();

    if (!question) return;

    const userBubble = document.createElement("div");
    userBubble.className = "my-msg";
    userBubble.textContent = question;
    messages.appendChild(userBubble);

    input.value = "";

    const q = question.toLowerCase();

    let answer = "Sorry, I could not find an answer.";

    try {

        const user =
            JSON.parse(localStorage.getItem("loggedUser"));

 // GREETINGS
// GREETINGS
if (
    q.includes("hello") ||
    q.includes("hi") ||
    q.includes("good morning") ||
    q.includes("good afternoon")
) {
    answer = `Hello ${user.name}! How can I help you today?`;
}

        // MY SAVINGS
      else  if (
            q.includes("my savings") ||
            q.includes("how much have i saved")
        ) {

            const { data } = await db
                .from("contributions")
                .select("amount")
                .eq("member_phone", user.phone);

            let total = 0;

            data.forEach(item => {
                total += Number(item.amount || 0);
            });

            answer =
                `You have saved KSh ${total.toLocaleString()}.`;
        }

        // GROUP BALANCE
        else if (
            q.includes("group savings") ||
            q.includes("group balance")
        ) {

            const { data } = await db
                .from("contributions")
                .select("amount");

            let total = 0;

            data.forEach(item => {
                total += Number(item.amount || 0);
            });

            answer =
                `Current group savings is KSh ${total.toLocaleString()}.`;
        }

        // MY RANK
        else if (
    q.includes("my rank") ||
    q.includes("ranking")
) {

    const { data } = await db
        .from("contributions")
        .select("member_phone, amount");

    const totals = {};

    data.forEach(item => {

        const phone =
            String(item.member_phone).replace(/\D/g,"");

        if(!totals[phone]){
            totals[phone] = 0;
        }

        totals[phone] += Number(item.amount || 0);

    });

    const ranking =
        Object.entries(totals)
        .sort((a,b)=>b[1]-a[1]);

    const myPhone =
        String(user.phone).replace(/\D/g,"");

    const index =
        ranking.findIndex(r => r[0] === myPhone);

    if(index >= 0){

        answer =
        `🏆 ${user.name}, you are currently ranked #${index+1} with total contributions of KSh ${ranking[index][1].toLocaleString()}.`;

    }else{

        answer =
        "I couldn't find your contribution record yet.";

    }

}

// MY SAVINGS
else if (
    q.includes("my savings") ||
    q.includes("how much have i saved")
) {

    const { data } = await db
        .from("contributions")
        .select("amount")
        .eq("member_phone", user.phone);

    let total = 0;

    data.forEach(item => {
        total += Number(item.amount || 0);
    });

    answer =
        `You have contributed KSh ${total.toLocaleString()}.`;
}

// MEMBER COUNT
else if (
    q.includes("how many members") ||
    q.includes("total members")
) {

    const { data } =
        await db.from("members")
        .select("id");

    answer =
        `There are ${data.length} registered members.`;
}

// GROUP BALANCE
else if (
    q.includes("group balance") ||
    q.includes("group savings")
) {

    const { data } =
        await db.from("contributions")
        .select("amount");

    let total = 0;

    data.forEach(item => {
        total += Number(item.amount || 0);
    });

    answer =
        `Current group savings is KSh ${total.toLocaleString()}.`;
}

// MY GOAL
else if (
    q.includes("goal") ||
    q.includes("goal progress")
) {

    const { data } =
        await db
        .from("contributions")
        .select("amount")
        .eq("member_phone", user.phone);

    let total = 0;

    data.forEach(item => {
        total += Number(item.amount || 0);
    });

    const goal =
        Number(user.goal || 5000);

    const percent =
        Math.round((total / goal) * 100);

    answer =
        `You have saved KSh ${total} out of KSh ${goal}. Progress: ${percent}%.`;
}

// NUMBER 1 CONTRIBUTOR
else if (
    q.includes("top contributor") ||
    q.includes("number 1")
) {

    const { data } =
        await db
        .from("contributions")
        .select("member_phone, amount");

    const totals = {};

    data.forEach(item => {

        if (!totals[item.member_phone]) {
            totals[item.member_phone] = 0;
        }

        totals[item.member_phone] +=
            Number(item.amount || 0);
    });

    const ranking =
        Object.entries(totals)
        .sort((a,b)=>b[1]-a[1]);

    if (ranking.length > 0) {

        const topPhone =
            ranking[0][0];

        const amount =
            ranking[0][1];

        const { data: member } =
            await db
            .from("members")
            .select("name")
            .eq("phone", topPhone)
            .single();

        answer =
            `${member.name} is the top contributor with KSh ${amount}.`;
    }
}

// LATEST ANNOUNCEMENT
else if (
    q.includes("latest announcement") ||
    q.includes("announcement")
) {

    const { data } =
        await db
        .from("announcements")
        .select("*")
        .order("created_at",
        { ascending:false })
        .limit(1);

    if (data.length > 0) {

        answer =
            `${data[0].title}: ${data[0].message}`;
    }
}

// LEADERS
else if (q.includes("chairman")) {
    answer = "Chairman phone: 0758211030";
}

else if (q.includes("secretary")) {
    answer = "Secretary phone: 0758034140";
}

else if (q.includes("treasurer")) {
    answer = "Treasurer phone: 0703927760";
}

else if (q.includes("organiser")) {
    answer = "Organiser phone: 0758438824";
}

else {
    answer =
        "I can help with savings, rankings, members, announcements, leaders and contribution information.";
}

        

    } catch(err) {

        answer = "Error: " + err.message;
    }

    const answerBubble = document.createElement("div");
    answerBubble.className = "other-msg";
    answerBubble.textContent = answer;
    messages.appendChild(answerBubble);

    messages.scrollTop =
        messages.scrollHeight;
}