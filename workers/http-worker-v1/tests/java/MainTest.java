import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

class MainTest {

    @Test
    public void testExample1() {
        int[] nums = { 2, 7, 11, 15 };
        int target = 9;
        int[] expected = { 0, 2 };
        assertArrayEquals(expected, Main.twoSum(nums, target));
    }

    @Test
    public void testExample2() {
        int[] nums = { 3, 2, 4 };
        int target = 6;
        int[] expected = { 1, 2 };
        assertArrayEquals(expected, Main.twoSum(nums, target));
    }

    @Test
    public void testExample3() {
        int[] nums = { 3, 3 };
        int target = 6;
        int[] expected = { 0, 1 };
        assertArrayEquals(expected, Main.twoSum(nums, target));
    }

    @Test
    public void testNegativeNumbers() {
        int[] nums = { -3, 4, 3, 90 };
        int target = 0;
        int[] expected = { 0, 2 };
        assertArrayEquals(expected, Main.twoSum(nums, target));
    }
}
