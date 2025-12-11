package com.example.app.managementapi.ManagementApiApplication.notification;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository repo;
    private final SimpMessagingTemplate messagingTemplate; // pentru WebSocket

    public Notification createNotification(String recipient, String sender, String type, String content, String payloadJson) {
        Notification n = new Notification();
        n.setRecipient(recipient);
        n.setSender(sender);
        n.setType(type);
        n.setContent(content);
        n.setPayload(payloadJson);
        n.setReadFlag(false);
        n.setCreatedAt(LocalDateTime.now());
        Notification saved = repo.save(n);

        messagingTemplate.convertAndSend("/topic/notifications/" + recipient.toLowerCase(), new NotificationDTO(
                saved.getId(), saved.getSender(), saved.getType(), saved.getContent(), saved.getPayload(), saved.getReadFlag(), saved.getCreatedAt()
        ));

        return saved;
    }

    public List<NotificationDTO> getNotificationsFor(String recipient) {
        return repo.findByRecipientOrderByCreatedAtDesc(recipient)
                .stream()
                .map(n -> new NotificationDTO(n.getId(), n.getSender(), n.getType(), n.getContent(), n.getPayload(), n.getReadFlag(), n.getCreatedAt()))
                .toList();
    }

    public void markAsRead(Long id) {
        repo.findById(id).ifPresent(n -> { n.setReadFlag(true); repo.save(n); });
    }

    public long countUnread(String recipient) {
        return repo.findByRecipientAndReadFlagFalse(recipient).size();
    }
}
