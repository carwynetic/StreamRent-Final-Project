module stream_rent::rental {
    // Import đầy đủ các thư viện cần thiết
    use iota::coin::{Self, Coin};
    use iota::balance::{Self, Balance};
    use iota::iota::IOTA;
    use iota::clock::{Self, Clock};
    use iota::event;
    use iota::object::{Self, UID, ID};
    use iota::transfer;
    use iota::tx_context::{Self, TxContext};
    use std::option::{Self, Option};
    use std::vector;
    
    // --- Error Codes ---
    const ENotAvailable: u64 = 1;
    const EInsufficientPayment: u64 = 2;
    const ENotRenter: u64 = 3;
    const ENotOwner: u64 = 4; // Lỗi mới: Không phải chủ thiết bị
    const EDeviceRented: u64 = 5; // Lỗi mới: Thiết bị đang được thuê

    // --- Structs ---

    // Thiết bị (Xe, Sạc dự phòng...)
    public struct Device has key, store {
        id: UID,
        name: vector<u8>,       
        price_per_ms: u64,      
        is_rented: bool,        
        renter: Option<address>,
        start_time: u64,        
        deposit: Balance<IOTA>, 
        owner: address          
    }

    // Sự kiện
    public struct RentalEvent has copy, drop {
        device_id: ID,
        renter: address,
        action: vector<u8>, 
    }

    // --- Functions ---

    // 1. Tạo thiết bị mới
    public fun create_device(
        name: vector<u8>,
        price_per_ms: u64,
        ctx: &mut TxContext
    ) {
        let device = Device {
            id: object::new(ctx),
            name: name,
            price_per_ms: price_per_ms,
            is_rented: false,
            renter: option::none(),
            start_time: 0,
            deposit: balance::zero(),
            owner: tx_context::sender(ctx)
        };
        transfer::share_object(device);
    }

    // 2. Thuê thiết bị
    public fun rent_device(
        device: &mut Device,
        payment: Coin<IOTA>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // 1. Kiểm tra trạng thái
        assert!(device.is_rented == false, EDeviceRented);
        
        // 2. Kiểm tra tiền cọc (Phải cọc tối thiểu 1 IOTA = 1 tỷ Nanos)
        let payment_value = coin::value(&payment);
        assert!(payment_value >= 1000000000, EInsufficientPayment); 

        // 3. Ghi nhận thông tin
        device.is_rented = true;
        device.renter = option::some(tx_context::sender(ctx));
        device.start_time = clock::timestamp_ms(clock);

        // 4. Cất tiền cọc vào trong thiết bị
        coin::put(&mut device.deposit, payment);

        // 5. Bắn Event
        event::emit(RentalEvent {
            device_id: object::id(device),
            renter: tx_context::sender(ctx),
            action: b"RENT"
        });
    }

    // 3. Trả thiết bị
    public fun return_device(
        device: &mut Device,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        // 1. Kiểm tra phải đúng người thuê không
        assert!(device.renter == option::some(sender), ENotRenter);

        // 2. Tính toán thời gian và chi phí
        let current_time = clock::timestamp_ms(clock);
        let duration = current_time - device.start_time;
        let total_cost = duration * device.price_per_ms;

        // 3. Xử lý tiền cọc
        let total_deposit = balance::value(&device.deposit);
        
        // Tránh lỗi tràn số nếu tiền thuê quá lớn
        let pay_amount = if (total_cost > total_deposit) { total_deposit } else { total_cost };
        let refund_amount = total_deposit - pay_amount;

        // 4. Trả tiền thuê cho chủ thiết bị
        let paid_coin = coin::take(&mut device.deposit, pay_amount, ctx);
        transfer::public_transfer(paid_coin, device.owner);

        // 5. Hoàn tiền thừa cho người thuê
        if (refund_amount > 0) {
            let refund_coin = coin::take(&mut device.deposit, refund_amount, ctx);
            transfer::public_transfer(refund_coin, sender);
        };

        // 6. Reset trạng thái
        device.is_rented = false;
        device.renter = option::none();
        device.start_time = 0;

        event::emit(RentalEvent {
            device_id: object::id(device),
            renter: sender,
            action: b"RETURN"
        });
    }
}