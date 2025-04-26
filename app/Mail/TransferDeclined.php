<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TransferDeclined extends Mailable
{
    use Queueable, SerializesModels;

    public $transferredItem;
    public $declinedByType;
    public $declinerName;
    public $declineReason;

    public function __construct($transferredItem, $declinedByType, $declinerName, $declineReason)
    {
        $this->transferredItem = $transferredItem;
        $this->declinedByType = $declinedByType;
        $this->declinerName = $declinerName;
        $this->declineReason = $declineReason;
    }

    public function build()
    {
        return $this->subject('Transfer Declined - ' . $this->transferredItem->description)
            ->markdown('emails.transfer-declined', [
                'transferredItem' => $this->transferredItem,
                'declinedByType' => $this->declinedByType,
                'declinerName' => $this->declinerName,
                'declineReason' => $this->declineReason
            ]);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Transfer Declined - ' . strip_tags($this->transferredItem->items),
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.transfer-declined',
            with: [
                'transferredItem' => $this->transferredItem,
                'declinedByType' => $this->declinedByType,
                'declinerName' => $this->declinerName
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
