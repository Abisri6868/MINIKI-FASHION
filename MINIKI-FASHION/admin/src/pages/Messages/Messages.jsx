import React, { useEffect, useState } from "react";
import axios from "axios";

function Messages() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    getMessages();
  }, []);

  const getMessages = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/messages");
      setMessages(res.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <h2>Customer Messages</h2>

      {messages.map((msg) => (
        <div key={msg._id}>
          <p>{msg.name}</p>
          <p>{msg.email}</p>
          <p>{msg.message}</p>
          <hr />
        </div>
      ))}
    </div>
  );
}

export default Messages;