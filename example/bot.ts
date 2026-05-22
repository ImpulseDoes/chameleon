import { Client } from '../src/index.ts'

const client = new Client({
  token: "",
  intents: ["Guilds", "GuildMessages", "MessageContent"],
  debug: true // does nothing (for now)
})

client.on("READY", () => {
    console.log(`Logged in as ${client.user?.username} (${client.user?.id})`);
})

client.on("MESSAGE_UPDATE", (event) => {
    console.log("Message Update Event Triggered!")
    console.log(event.oldMessage?.content)
    console.log(event.message?.content)
})

client.on("MESSAGE_DELETE", (event) => {
    console.log("Message Delete Event Triggered!")
    console.log(event.message?.content)
})

client.login()