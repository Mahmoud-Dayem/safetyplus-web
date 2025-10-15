  import { Linking } from "react-native";

  export const handleShareToWhatsApp = (item) => {
    // const message = `Check out this spare part:\n\nCode: ${item.code}\nTitle: ${item.title}\n`;
        const message = `Check out this spare part:\n\nOld Code: ${item.code}\nNew Code: ${item.new_code} \n\nTitle: ${item.title}\n`;


    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;

    Linking.openURL(url)
      .then(() => { })
      .catch(() => {
        alert("WhatsApp not installed on your device");
      });
  };